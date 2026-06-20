from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsTeacherOwnerOrAdmin(BasePermission):
    """
    View-level: any authenticated user passes has_permission.
    Object-level rules:

    WRITE (POST/PUT/PATCH/DELETE):
        - Admin: always allowed
        - Teacher: only if they own the course/lesson
        - Student: never

    READ (GET/HEAD/OPTIONS):
        - Admin: always allowed
        - Teacher: only their own courses/lessons
        - Student: course must be published (no enrollment gate here —
          enrollment is enforced at the lesson level, not course detail)
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Resolve the owning course regardless of whether obj is Course or Lesson
        if hasattr(obj, 'teacher'):
            course = obj          # obj is a Course
        elif hasattr(obj, 'course'):
            course = obj.course   # obj is a Lesson
        else:
            return False

        # ── Write operations ──────────────────────────────────────────────
        if request.method not in SAFE_METHODS:
            if user.is_admin:
                return True
            if user.is_teacher:
                return course.teacher == user
            return False  # students cannot write

        # ── Read operations ───────────────────────────────────────────────
        if user.is_admin:
            return True

        if user.is_teacher:
            return course.teacher == user

        if user.is_student:
            # Students can read any published course detail (to browse/decide to enroll).
            # Lesson-level access is gated separately in LessonListCreateView.get_queryset.
            return course.status == 'published'

        return False


class IsPublishActionAllowed(BasePermission):
    """
    Guards the dedicated publish/unpublish endpoint.
    - Admin: always allowed
    - Teacher: only for their own course
    - Student: never
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and not request.user.is_student)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_admin:
            return True
        if user.is_teacher:
            return obj.teacher == user
        return False
