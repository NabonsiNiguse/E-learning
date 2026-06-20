"""
Teacher-specific course management views.
Teachers can only manage courses they own.
"""
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Course
from .serializers import CourseSerializer
from users.permissions import IsTeacher


class TeacherCourseListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/teacher/courses/ — List own courses
    POST /api/v1/teacher/courses/ — Create new course
    """
    serializer_class = CourseSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        """Teachers only see their own courses."""
        return Course.objects.filter(teacher=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        """Automatically set teacher to current user."""
        serializer.save(teacher=self.request.user, created_by=self.request.user)


class TeacherCourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/teacher/courses/{id}/ — View course details
    PATCH /api/v1/teacher/courses/{id}/ — Update course
    DELETE /api/v1/teacher/courses/{id}/ — Delete course
    """
    serializer_class = CourseSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        """Teachers can only access their own courses."""
        return Course.objects.filter(teacher=self.request.user)

    def perform_destroy(self, instance):
        """Teachers can only delete courses with no active enrollments."""
        active_enrollments = instance.enrollments.filter(status='active').count()
        if active_enrollments > 0:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                f'Cannot delete course with {active_enrollments} active enrollments. '
                'Archive the course instead.'
            )
        instance.delete()


class TeacherSubmitResultsView(generics.GenericAPIView):
    """
    POST /api/v1/teacher/courses/{id}/submit-results/
    Teacher submits final results for a course.
    """
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return Course.objects.filter(teacher=self.request.user)

    def post(self, request, pk):
        try:
            course = self.get_queryset().get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if course.locked:
            return Response(
                {'success': False, 'message': 'Results already submitted and locked.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if course.status != Course.Status.PUBLISHED:
            return Response(
                {'success': False, 'message': 'Only published courses can submit results.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        course.locked = True
        course.results_submitted_at = timezone.now()
        course.save()

        return Response({
            'success': True,
            'message': 'Results submitted and locked successfully.',
            'data': {
                'course_id': course.id,
                'locked': course.locked,
                'results_submitted_at': course.results_submitted_at,
            }
        })


class TeacherLockResultsView(generics.GenericAPIView):
    """
    PATCH /api/v1/teacher/courses/{id}/lock-results/
    Teacher locks results to prevent further changes.
    """
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return Course.objects.filter(teacher=self.request.user)

    def patch(self, request, pk):
        try:
            course = self.get_queryset().get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if course.locked:
            return Response(
                {'success': False, 'message': 'Results already locked.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        course.locked = True
        course.results_submitted_at = timezone.now()
        course.save()

        return Response({
            'success': True,
            'message': 'Results locked successfully.',
            'data': {
                'course_id': course.id,
                'locked': course.locked,
                'results_submitted_at': course.results_submitted_at,
            }
        })


class TeacherCourseStatsView(generics.GenericAPIView):
    """
    GET /api/v1/teacher/courses/{id}/stats/
    Get course statistics (enrollment, grades, etc.)
    """
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return Course.objects.filter(teacher=self.request.user)

    def get(self, request, pk):
        try:
            course = self.get_queryset().get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        enrolled_count = course.enrollments.filter(status='active').count()
        lesson_count = course.lessons.count()

        return Response({
            'success': True,
            'data': {
                'course_id': course.id,
                'title': course.title,
                'enrolled_students': enrolled_count,
                'total_lessons': lesson_count,
                'status': course.status,
                'locked': course.locked,
                'results_submitted_at': course.results_submitted_at,
            }
        })
