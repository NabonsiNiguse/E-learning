from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Only admin users (includes super_admin)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsSuperAdmin(BasePermission):
    """Only super_admin users — for grade overrides and escalated disputes."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_super_admin)


class IsAdminOnly(BasePermission):
    """Plain admin only — not super_admin, not teacher."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_only)


class IsTeacher(BasePermission):
    """Only teacher users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_teacher)


class IsStudent(BasePermission):
    """Only student users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_student)


class IsAdminOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('admin', 'super_admin', 'teacher')
        )


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsSelfOrAdmin(BasePermission):
    """Allow users to access their own data; admins can access any."""
    def has_object_permission(self, request, view, obj):
        return request.user.is_admin or obj == request.user
