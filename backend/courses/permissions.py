from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsTeacherOwnerOrAdmin(BasePermission):
    """
    Object-level permissions:
    - Admin: full access.
    - Faculty Dean: read/write if the course belongs to a department under their faculty.
    - Department Head: read/write if the course belongs to their department.
    - Teacher: read/write if they teach any offering of the course.
    - Student: read safe methods if published.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Resolve Course
        if hasattr(obj, 'department'):
            course = obj
        elif hasattr(obj, 'course'):
            course = obj.course
        else:
            return False

        if user.is_super_admin or user.is_admin_only:
            return True

        if user.is_dean:
            return course.department and course.department.faculty.dean == user

        if user.is_dept_head:
            return course.department and course.department.head == user

        if user.is_teacher:
            return course.offerings.filter(instructor=user).exists()

        if user.is_student:
            return request.method in SAFE_METHODS and course.status == 'published'

        return False


class IsPublishActionAllowed(BasePermission):
    """
    Guards the publish endpoint.
    Admin, Dean (own faculty), Head (own department) can publish.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and not request.user.is_student)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_super_admin or user.is_admin_only:
            return True
        if user.is_dean:
            return obj.department and obj.department.faculty.dean == user
        if user.is_dept_head:
            return obj.department and obj.department.head == user
        return False
