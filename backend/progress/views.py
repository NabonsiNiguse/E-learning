from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q

from .models import Progress
from .serializers import ProgressSerializer
from enrollments.models import Enrollment
from courses.models import Lesson
from users.permissions import IsStudent


class ProgressListView(generics.ListAPIView):
    """Student: list all their progress records."""
    serializer_class   = ProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs   = Progress.objects.select_related('lesson', 'lesson__course')
        if user.is_admin:
            return qs
        if user.is_teacher:
            return qs.filter(lesson__course__teacher=user)
        return qs.filter(student=user)


class MarkLessonCompleteView(APIView):
    """
    POST /api/v1/progress/complete/
    Body: { "lesson_id": <int> }
    Marks a lesson as complete for the authenticated student.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_student:
            return Response(
                {'success': False, 'message': 'Only students can track progress.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return Response(
                {'success': False, 'message': 'lesson_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            lesson = Lesson.objects.select_related('course').get(pk=lesson_id)
        except Lesson.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Lesson not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify enrollment
        enrolled = Enrollment.objects.filter(
            student=request.user,
            course=lesson.course,
            status__in=['active', 'completed'],
        ).exists()
        if not enrolled:
            return Response(
                {'success': False, 'message': 'You are not enrolled in this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        progress, created = Progress.objects.get_or_create(
            student=request.user,
            lesson=lesson,
        )
        already_done = not created and progress.completed
        if not progress.completed:
            progress.completed    = True
            progress.completed_at = timezone.now()
            progress.save()

        # Calculate course completion percentage
        total_lessons     = Lesson.objects.filter(
            course=lesson.course, status='published'
        ).count()
        completed_lessons = Progress.objects.filter(
            student=request.user,
            lesson__course=lesson.course,
            completed=True,
        ).count()
        percentage = round((completed_lessons / total_lessons * 100), 1) if total_lessons else 0

        return Response({
            'success': True,
            'message': 'Already completed.' if already_done else 'Lesson marked as complete.',
            'progress': ProgressSerializer(progress).data,
            'course_completion_percentage': percentage,
        })


class CourseProgressView(APIView):
    """
    GET /api/v1/progress/course/<course_id>/
    Students: returns their own progress summary for the course.
    Admins/Teachers: not applicable here — use ProgressListView filtered by course.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        user = request.user

        if not user.is_student:
            return Response(
                {'success': False, 'message': 'Only students can view course progress this way.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Verify enrollment
        try:
            enrollment = Enrollment.objects.get(
                student=user, course_id=course_id,
                status__in=['active', 'completed'],
            )
        except Enrollment.DoesNotExist:
            return Response(
                {'success': False, 'message': 'You are not enrolled in this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        lessons = Lesson.objects.filter(course_id=course_id, status='published').order_by('order')
        progress_map = {
            p.lesson_id: p
            for p in Progress.objects.filter(student=user, lesson__course_id=course_id)
        }

        lesson_data = []
        for lesson in lessons:
            p = progress_map.get(lesson.id)
            lesson_data.append({
                'lesson_id':    lesson.id,
                'title':        lesson.title,
                'order':        lesson.order,
                'completed':    p.completed if p else False,
                'completed_at': p.completed_at if p else None,
            })

        total     = len(lesson_data)
        completed = sum(1 for l in lesson_data if l['completed'])
        percentage = round((completed / total * 100), 1) if total else 0

        return Response({
            'success':    True,
            'course_id':  course_id,
            'enrollment_status': enrollment.status,
            'total_lessons':     total,
            'completed_lessons': completed,
            'completion_percentage': percentage,
            'lessons': lesson_data,
        })
