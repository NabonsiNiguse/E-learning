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
from courses.models import CourseOffering
from enrollments.models import Enrollment


class AttendanceListCreateView(generics.ListCreateAPIView):
    """
    GET  — teacher sees records for their offerings; student sees own records; admin sees all.
    POST — teacher or admin creates a single record.
    """
    serializer_class = AttendanceRecordSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['course_offering', 'student', 'date', 'status']
    ordering_fields  = ['date', 'status']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs   = AttendanceRecord.objects.select_related('student', 'course_offering__course', 'marked_by')
        if user.is_super_admin or user.is_admin_only:
            return qs
        if user.is_teacher:
            return qs.filter(course_offering__instructor=user)
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
        qs   = AttendanceRecord.objects.select_related('student', 'course_offering__course', 'marked_by')
        if user.is_super_admin or user.is_admin_only:
            return qs
        if user.is_teacher:
            return qs.filter(course_offering__instructor=user)
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
    Body: { course_offering, date, records: [{student, status, notes?}, ...] }
    """
    permission_classes = [IsAdminOrTeacher]

    def post(self, request):
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data    = serializer.validated_data
        teacher = request.user

        try:
            offering = CourseOffering.objects.get(pk=data['course_offering'])
        except CourseOffering.DoesNotExist:
            return Response({'success': False, 'message': 'Course offering not found.'}, status=404)

        if teacher.is_teacher and offering.instructor != teacher:
            return Response(
                {'success': False, 'message': 'You are not the instructor for this offering.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        created_count = 0
        updated_count = 0
        errors        = []

        for r in data['records']:
            try:
                record, created = AttendanceRecord.objects.update_or_create(
                    student_id = r['student'],
                    course_offering = offering,
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
    GET /api/v1/attendance/summary/?course_offering=<id>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        offering_id = request.query_params.get('course_offering')
        if not offering_id:
            return Response(
                {'success': False, 'message': 'course_offering query param is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        try:
            offering = CourseOffering.objects.get(pk=offering_id)
        except CourseOffering.DoesNotExist:
            return Response({'success': False, 'message': 'Course offering not found.'}, status=404)

        if user.is_teacher and offering.instructor != user:
            return Response({'success': False, 'message': 'Access denied.'}, status=403)

        # Get enrolled students
        if user.is_student:
            students = [user]
        else:
            enrolled_ids = Enrollment.objects.filter(
                course_offering=offering, status__in=['active', 'completed']
            ).values_list('student_id', flat=True)
            from users.models import User
            students = User.objects.filter(id__in=enrolled_ids)

        student_ids = [s.id for s in students]
        attendance_stats = AttendanceRecord.objects.filter(
            student_id__in=student_ids, course_offering=offering
        ).values('student_id').annotate(
            total=Count('id'),
            present=Count(Case(When(status='present', then=1), output_field=IntegerField())),
            absent=Count(Case(When(status='absent', then=1), output_field=IntegerField())),
            late=Count(Case(When(status='late', then=1), output_field=IntegerField())),
            excused=Count(Case(When(status='excused', then=1), output_field=IntegerField())),
        )
        
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
            'course_offering': {'id': offering.id, 'title': offering.course.title},
            'summaries': summaries,
        })
