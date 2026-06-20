from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Course, Lesson
from .serializers import (
    CourseSerializer, CourseListSerializer,
    LessonSerializer, LessonListSerializer,
)
from .permissions import IsTeacherOwnerOrAdmin, IsPublishActionAllowed
from .filters import CourseFilter
from users.permissions import IsAdminOrTeacher


# =============================================================================
# Courses
# =============================================================================

class CourseListCreateView(generics.ListCreateAPIView):
    """
    GET  — authenticated users
           Admin  : all courses (any status)
           Teacher: own courses only (any status)
           Student: published courses only
    POST — Admin or Teacher only
           Teacher: always assigned as the course owner
           Admin  : must supply a teacher field (a user with role=teacher)
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CourseFilter
    search_fields   = ['title', 'description', 'category', 'tags']
    ordering_fields = ['created_at', 'title', 'price']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseSerializer
        return CourseListSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Course.objects.select_related('teacher').prefetch_related('lessons')
        if user.is_admin:
            return qs
        if user.is_teacher:
            return qs.filter(teacher=user)
        # Students see only published courses
        return qs.filter(status=Course.Status.PUBLISHED)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return Response(
            {
                'success': True,
                'message': 'Course created as draft.',
                'course': CourseSerializer(course, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET        — Admin (any), Teacher (own), Student (published only)
    PUT/PATCH  — Admin (any), Teacher (own course only)
                 Status changes are blocked here — use /publish/ endpoint
    DELETE     — Admin (any), Teacher (own course only)
                 Cannot delete a course that has active enrollments
    """
    permission_classes = [IsTeacherOwnerOrAdmin]
    serializer_class   = CourseSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Course.objects.select_related('teacher').prefetch_related('lessons')
        if user.is_admin:
            return qs
        if user.is_teacher:
            return qs.filter(teacher=user)
        # Students can browse any published course detail (to decide whether to enroll)
        return qs.filter(status=Course.Status.PUBLISHED)

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()  # triggers has_object_permission
        # Guard: cannot delete a course with active enrollments
        active_count = course.enrollments.filter(status='active').count()
        if active_count > 0:
            return Response(
                {
                    'success': False,
                    'message': (
                        f'Cannot delete: {active_count} student(s) are actively enrolled. '
                        'Archive the course instead.'
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )
        course.delete()
        return Response({'success': True, 'message': 'Course deleted.'})


class CoursePublishView(APIView):
    """
    POST /api/v1/courses/<pk>/publish/
    Body: { "action": "publish" | "unpublish" | "archive" }

    Allowed transitions:
        draft     → published  (requires at least 1 published lesson)
        published → archived
        published → draft      (unpublish)
        archived  → draft      (reactivate)

    Admin: any course
    Teacher: own course only
    Student: forbidden
    """
    permission_classes = [IsPublishActionAllowed]

    # Valid (from_status, to_status) pairs
    VALID_TRANSITIONS = {
        ('draft',     'published'),
        ('published', 'archived'),
        ('published', 'draft'),
        ('archived',  'draft'),
    }

    ACTION_MAP = {
        'publish':   'published',
        'unpublish': 'draft',
        'archive':   'archived',
        'reactivate': 'draft',
    }

    def post(self, request, pk):
        try:
            course = Course.objects.select_related('teacher').get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Object-level permission check
        self.check_object_permissions(request, course)

        action = request.data.get('action', '').strip().lower()
        if action not in self.ACTION_MAP:
            return Response(
                {
                    'success': False,
                    'message': f'Invalid action. Choose from: {", ".join(self.ACTION_MAP)}',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status  = self.ACTION_MAP[action]
        transition  = (course.status, new_status)

        if transition not in self.VALID_TRANSITIONS:
            return Response(
                {
                    'success': False,
                    'message': (
                        f'Cannot transition from "{course.status}" to "{new_status}". '
                        f'Valid transitions: {self.VALID_TRANSITIONS}'
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Publishing requires at least one published lesson
        if new_status == 'published':
            published_lessons = course.lessons.filter(status=Lesson.Status.PUBLISHED).count()
            if published_lessons == 0:
                return Response(
                    {
                        'success': False,
                        'message': 'Cannot publish: course must have at least one published lesson.',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        course.status = new_status
        course.save(update_fields=['status', 'updated_at'])

        return Response(
            {
                'success': True,
                'message': f'Course status changed to "{new_status}".',
                'course_id': course.pk,
                'status': new_status,
            }
        )


# =============================================================================
# Lessons
# =============================================================================

class LessonListCreateView(generics.ListCreateAPIView):
    """
    GET  — Admin (all), Teacher (own course), Student (published + enrolled only)
    POST — Admin (any course), Teacher (own course only)
    """
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LessonSerializer
        return LessonListSerializer

    def get_queryset(self):
        course_pk = self.kwargs['course_pk']
        user      = self.request.user
        qs        = Lesson.objects.filter(course_id=course_pk)

        if user.is_admin:
            return qs
        if user.is_teacher:
            # Teacher sees only lessons in their own courses
            return qs.filter(course__teacher=user)

        # Student: must be actively enrolled; sees published lessons only
        from enrollments.models import Enrollment
        is_enrolled = Enrollment.objects.filter(
            student=user,
            course_id=course_pk,
            status__in=['active', 'completed'],
        ).exists()
        if not is_enrolled:
            return Lesson.objects.none()
        return qs.filter(status=Lesson.Status.PUBLISHED)

    def create(self, request, *args, **kwargs):
        course_pk = self.kwargs['course_pk']

        try:
            course = Course.objects.get(pk=course_pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Teacher ownership check (admin can add lessons to any course)
        if request.user.is_teacher and course.teacher != request.user:
            return Response(
                {'success': False, 'message': 'You do not own this course.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data           = request.data.copy()
        data['course'] = course_pk
        serializer     = LessonSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save(created_by=request.user)
        return Response(
            {
                'success': True,
                'message': 'Lesson created.',
                'lesson': LessonSerializer(lesson).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET        — Admin, Teacher (own), Student (published + enrolled)
    PUT/PATCH  — Admin, Teacher (own course)
    DELETE     — Admin, Teacher (own course)
    """
    permission_classes = [IsTeacherOwnerOrAdmin]
    serializer_class   = LessonSerializer

    def get_queryset(self):
        return Lesson.objects.select_related('course__teacher').filter(
            course_id=self.kwargs['course_pk']
        )

    def destroy(self, request, *args, **kwargs):
        lesson = self.get_object()
        lesson.delete()
        return Response({'success': True, 'message': 'Lesson deleted.'})
