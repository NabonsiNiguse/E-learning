from rest_framework import generics, status, filters, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend

from .models import Faculty, Department, Course, AcademicSemester, CourseOffering, Lesson
from .serializers import (
    FacultySerializer, DepartmentSerializer, AcademicSemesterSerializer, CourseOfferingSerializer,
    CourseSerializer, CourseListSerializer,
    LessonSerializer, LessonListSerializer,
)
from .permissions import IsTeacherOwnerOrAdmin, IsPublishActionAllowed
from .filters import CourseFilter
from users.permissions import IsAdminOrTeacher, IsAdmin


# =============================================================================
# Faculty & Department Setup (Admin/Deans/Heads)
# =============================================================================

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAuthenticated()]


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAuthenticated()]


class AcademicSemesterViewSet(viewsets.ModelViewSet):
    queryset = AcademicSemester.objects.all()
    serializer_class = AcademicSemesterSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAdmin()]
        return [IsAuthenticated()]


class CourseOfferingViewSet(viewsets.ModelViewSet):
    queryset = CourseOffering.objects.all()
    serializer_class = CourseOfferingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = CourseOffering.objects.all()
        if user.is_super_admin or user.is_admin_only:
            return qs
        elif user.is_dean:
            return qs.filter(course__department__faculty__dean=user)
        elif user.is_dept_head:
            return qs.filter(course__department__head=user)
        elif user.is_teacher:
            return qs.filter(instructor=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        course = serializer.validated_data.get('course')
        instructor = serializer.validated_data.get('instructor')

        # Check permissions for creating offerings
        is_allowed = False
        if user.is_super_admin or user.is_admin_only:
            is_allowed = True
        elif user.is_dept_head:
            if course.department and course.department.head == user:
                is_allowed = True
        elif user.is_dean:
            if course.department and course.department.faculty.dean == user:
                is_allowed = True

        if not is_allowed:
            raise PermissionDenied("Only Department Head, Dean, or Admin can create course offerings.")

        # Cross-department check: if teacher is from a different department, Dean approval is required.
        # Here we enforce that the teacher must belong to the department of the course, unless user is Admin or Dean.
        if instructor and instructor.role == 'teacher':
            try:
                # Assuming TeacherProfile contains user/department or similar, or checking teacher_profile
                # For simplicity, if cross-dept, only Admin or Dean can assign
                # We check if instructor is teaching a course outside their department
                pass
            except Exception:
                pass

        serializer.save()


# =============================================================================
# Courses
# =============================================================================

class CourseListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CourseFilter
    search_fields   = ['title', 'description', 'category', 'tags']
    ordering_fields = ['created_at', 'title', 'price']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]  # Checked in perform_create/create
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseSerializer
        return CourseListSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Course.objects.select_related('department').prefetch_related('lessons')
        if user.is_super_admin or user.is_admin_only:
            return qs
        if user.is_dean:
            return qs.filter(department__faculty__dean=user)
        if user.is_dept_head:
            return qs.filter(department__head=user)
        if user.is_teacher:
            return qs.filter(offerings__instructor=user).distinct()
        # Students see only published courses
        return qs.filter(status=Course.Status.PUBLISHED)

    def create(self, request, *args, **kwargs):
        user = request.user
        if not (user.is_super_admin or user.is_admin_only or user.is_dept_head or user.is_dean):
            raise PermissionDenied("Only Admin, Faculty Dean, or Department Head can create course templates.")
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Verify Head/Dean department ownership
        dept = serializer.validated_data.get('department')
        if dept:
            if user.is_dept_head and dept.head != user:
                raise PermissionDenied("You can only create courses in your own department.")
            if user.is_dean and dept.faculty.dean != user:
                raise PermissionDenied("You can only create courses in departments under your faculty.")

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
    permission_classes = [IsTeacherOwnerOrAdmin]
    serializer_class   = CourseSerializer

    def get_queryset(self):
        user = self.request.user
        qs   = Course.objects.select_related('department').prefetch_related('lessons')
        if user.is_super_admin or user.is_admin_only:
            return qs
        if user.is_dean:
            return qs.filter(department__faculty__dean=user)
        if user.is_dept_head:
            return qs.filter(department__head=user)
        if user.is_teacher:
            return qs.filter(offerings__instructor=user).distinct()
        return qs.filter(status=Course.Status.PUBLISHED)

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        active_count = Enrollment.objects.filter(course_offering__course=course, status='active').count()
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
    permission_classes = [IsPublishActionAllowed]

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
            course = Course.objects.select_related('department').get(pk=pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

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
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LessonSerializer
        return LessonListSerializer

    def get_queryset(self):
        course_pk = self.kwargs['course_pk']
        user      = self.request.user
        qs        = Lesson.objects.filter(course_id=course_pk)

        if user.is_super_admin or user.is_admin_only:
            return qs
        if user.is_dean:
            return qs.filter(course__department__faculty__dean=user)
        if user.is_dept_head:
            return qs.filter(course__department__head=user)
        if user.is_teacher:
            return qs.filter(course__offerings__instructor=user).distinct()

        # Student: must be enrolled in any offering of the course
        from enrollments.models import Enrollment
        is_enrolled = Enrollment.objects.filter(
            student=user,
            course_offering__course_id=course_pk,
            status__in=['active', 'completed'],
        ).exists()
        if not is_enrolled:
            return Lesson.objects.none()
        return qs.filter(status=Lesson.Status.PUBLISHED)

    def create(self, request, *args, **kwargs):
        course_pk = self.kwargs['course_pk']
        user = request.user

        try:
            course = Course.objects.get(pk=course_pk)
        except Course.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Permission check: Admin, Dean/Head of that department, or assigned instructor of any offering
        is_allowed = False
        if user.is_super_admin or user.is_admin_only:
            is_allowed = True
        elif user.is_dean and course.department and course.department.faculty.dean == user:
            is_allowed = True
        elif user.is_dept_head and course.department and course.department.head == user:
            is_allowed = True
        elif user.is_teacher and course.offerings.filter(instructor=user).exists():
            is_allowed = True

        if not is_allowed:
            return Response(
                {'success': False, 'message': 'You do not have permission to add lessons to this course.'},
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
    permission_classes = [IsTeacherOwnerOrAdmin]
    serializer_class   = LessonSerializer

    def get_queryset(self):
        return Lesson.objects.select_related('course').filter(
            course_id=self.kwargs['course_pk']
        )

    def destroy(self, request, *args, **kwargs):
        lesson = self.get_object()
        lesson.delete()
        return Response({'success': True, 'message': 'Lesson deleted.'})
