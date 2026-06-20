from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q, Case, When, IntegerField

from .models import AttendanceRecord
from .serializers import (
    AttendanceRecordSerializer, BulkAttendanceSerializer,
    AttendanceSummarySerializer,
)
from users.permissions import IsAdmin, IsTeacher, IsAdminOrTeacher
from courses.models import Course
from enrollments.models import Enrollment


class AttendanceListCreateView(generics.ListCreateAPIView):
    """
    GET  — teacher sees records for their courses; student sees own records; admin sees all.
    POST — teacher or admin creates a single record.
    """
    serializer_class = AttendanceRecordSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course', 'student', 'date', 'status']
    ordering_fields  = ['date', 'status']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs   = AttendanceRecord.objects.select_related('student', 'course', 'marked_by')
        if user.is_admin:
            return qs
        if user.is_teacher:
            return qs.filter(course__teacher=user)
        # Student: own records only
        return qs.filter(student=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        record = serializer.save()
        return Response({
            'success': True,
            'message': 'Attendance recorded.',
            'data': AttendanceRecordSerializer(record).data,
        }, status=status.HTTP_201_CREATED)


class AttendanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Teacher/admin can update or delete a record."""
    serializer_class = AttendanceRecordSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        user = self.request.user
        qs   = AttendanceRecord.objects.select_related('student', 'course', 'marked_by')
        if user.is_admin:
            return qs
        if user.is_teacher:
            return qs.filter(course__teacher=user)
        return qs.filter(student=user)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        record = self.get_object()
        record.delete()
        return Response({'success': True, 'message': 'Record deleted.'})


class BulkAttendanceView(APIView):
    """
    POST /api/v1/attendance/bulk/
    Teacher marks attendance for all students in a session at once.
    Body: { course, date, records: [{student, status, notes?}, ...] }
    Uses update_or_create so re-submitting a session is safe.
    """
    permission_classes = [IsAdminOrTeacher]

    def post(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data    = serializer.validated_data
        teacher = request.user

        try:
            course = Course.objects.get(pk=data['course'])
        except Course.DoesNotExist:
            return Response({'success': False, 'message': 'Course not found.'}, status=404)

        if teacher.is_teacher and course.teacher != teacher:
            return Response(
                {'success': False, 'message': 'You do not own this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        created_count = 0
        updated_count = 0
        errors        = []

        for r in data['records']:
            try:
                record, created = AttendanceRecord.objects.update_or_create(
                    student_id = r['student'],
                    course     = course,
                    date       = data['date'],
                    defaults   = {
                        'status':    r['status'],
                        'notes':     r.get('notes', ''),
                        'marked_by': teacher,
                    }
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            except Exception as e:
                errors.append({'student': r.get('student'), 'error': str(e)})

        return Response({
            'success': True,
            'message': f'{created_count} created, {updated_count} updated.',
            'errors':  errors,
        })


class AttendanceSummaryView(APIView):
    """
    GET /api/v1/attendance/summary/?course=<id>
    Returns per-student attendance summary for a course.
    Teachers see all students; students see only themselves.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        course_id = request.query_params.get('course')
        if not course_id:
            return Response(
                {'success': False, 'message': 'course query param is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        # Verify access
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return Response({'success': False, 'message': 'Course not found.'}, status=404)

        if user.is_teacher and course.teacher != user:
            return Response({'success': False, 'message': 'Access denied.'}, status=403)

        # Get enrolled students
        if user.is_student:
            students = [user]
        else:
            enrolled_ids = Enrollment.objects.filter(
                course=course, status__in=['active', 'completed']
            ).values_list('student_id', flat=True)
            from users.models import User
            students = User.objects.filter(id__in=enrolled_ids)

        # Aggregate all attendance data in a single query
        from django.db.models import Case, When, IntegerField
        
        student_ids = [s.id for s in students]
        attendance_stats = AttendanceRecord.objects.filter(
            student_id__in=student_ids, course=course
        ).values('student_id').annotate(
            total=Count('id'),
            present=Count(Case(When(status='present', then=1), output_field=IntegerField())),
            absent=Count(Case(When(status='absent', then=1), output_field=IntegerField())),
            late=Count(Case(When(status='late', then=1), output_field=IntegerField())),
            excused=Count(Case(When(status='excused', then=1), output_field=IntegerField())),
        )
        
        # Create lookup dict
        stats_by_student = {stat['student_id']: stat for stat in attendance_stats}
        
        summaries = []
        for student in students:
            stats = stats_by_student.get(student.id, {
                'total': 0, 'present': 0, 'absent': 0, 'late': 0, 'excused': 0
            })
            total = stats['total']
            present = stats['present']
            late = stats['late']
            pct = round((present + late) / total * 100, 1) if total else 0.0

            summaries.append({
                'student_id': student.id,
                'student_name': student.full_name,
                'student_email': student.email,
                'total': total,
                'present': present,
                'absent': stats['absent'],
                'late': late,
                'excused': stats['excused'],
                'percentage': pct,
            })

        return Response({
            'success':  True,
            'course':   {'id': course.id, 'title': course.title},
            'summaries': summaries,
        })
