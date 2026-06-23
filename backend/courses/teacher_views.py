from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone

from .models import Course, CourseOffering
from .serializers import CourseSerializer
from users.permissions import IsTeacher
from enrollments.models import Enrollment
from results.models import Grade


class TeacherCourseListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/teacher/courses/ — List own courses
    """
    serializer_class = CourseSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        """Teachers only see courses they have offerings in."""
        return Course.objects.filter(offerings__instructor=self.request.user).distinct().order_by('-created_at')

    def post(self, request, *args, **kwargs):
        raise PermissionDenied("Teachers cannot create course templates. Please contact the Department Head or Admin.")


class TeacherCourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/teacher/courses/{id}/ — View course details
    """
    serializer_class = CourseSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        """Teachers can only access courses they have offerings in."""
        return Course.objects.filter(offerings__instructor=self.request.user).distinct()

    def update(self, request, *args, **kwargs):
        raise PermissionDenied("Teachers cannot edit course templates. Please contact the Department Head or Admin.")

    def destroy(self, request, *args, **kwargs):
        raise PermissionDenied("Teachers cannot delete course templates. Please contact the Department Head or Admin.")


class TeacherSubmitResultsView(generics.GenericAPIView):
    """
    POST /api/v1/teacher/courses/{id}/submit-results/
    Locks grades for all student enrollments under this teacher's offerings of the course.
    """
    permission_classes = [IsTeacher]

    def post(self, request, pk):
        try:
            course = Course.objects.filter(offerings__instructor=request.user).distinct().get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Submit / lock grades for all student enrollments under teacher's offering
        offerings = CourseOffering.objects.filter(course=course, instructor=request.user)
        grades = Grade.objects.filter(enrollment__course_offering__in=offerings)

        if not grades.exists():
            return Response(
                {'success': False, 'message': 'No grades found to lock.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_count = grades.filter(status=Grade.Status.DRAFT).update(status=Grade.Status.LOCKED)

        return Response({
            'success': True,
            'message': f'Submitted and locked results for {updated_count} student enrollment(s).'
        })


class TeacherLockResultsView(generics.GenericAPIView):
    """
    PATCH /api/v1/teacher/courses/{id}/lock-results/
    Locks grades for all student enrollments under this teacher's offerings of the course.
    """
    permission_classes = [IsTeacher]

    def patch(self, request, pk):
        try:
            course = Course.objects.filter(offerings__instructor=request.user).distinct().get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        offerings = CourseOffering.objects.filter(course=course, instructor=request.user)
        grades = Grade.objects.filter(enrollment__course_offering__in=offerings)

        if not grades.exists():
            return Response(
                {'success': False, 'message': 'No grades found to lock.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_count = grades.filter(status=Grade.Status.DRAFT).update(status=Grade.Status.LOCKED)

        return Response({
            'success': True,
            'message': f'Locked results for {updated_count} student enrollment(s).'
        })


class TeacherCourseStatsView(generics.GenericAPIView):
    """
    GET /api/v1/teacher/courses/{id}/stats/
    """
    permission_classes = [IsTeacher]

    def get(self, request, pk):
        try:
            course = Course.objects.filter(offerings__instructor=request.user).distinct().get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        enrolled_count = Enrollment.objects.filter(course_offering__course=course, status='active').count()
        lesson_count = course.lessons.count()

        return Response({
            'success': True,
            'data': {
                'course_id': course.id,
                'title': course.title,
                'enrolled_students': enrolled_count,
                'total_lessons': lesson_count,
                'status': course.status,
            }
        })
