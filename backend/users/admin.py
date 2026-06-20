"""
Users admin — full user management with role-based access, inline profiles,
deactivation actions, and data integrity constraints.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db.models import Count, Q
from django.utils import timezone
from .models import User, TeacherProfile, StudentProfile


# ---------------------------------------------------------------------------
# Inline profiles
# ---------------------------------------------------------------------------
class TeacherProfileInline(admin.StackedInline):
    model       = TeacherProfile
    can_delete  = False
    verbose_name_plural = "Teacher Profile"
    fields      = ['bio', 'expertise', 'website']
    extra       = 0


class StudentProfileInline(admin.StackedInline):
    model       = StudentProfile
    can_delete  = False
    verbose_name_plural = "Student Profile"
    fields      = ['bio']
    extra       = 0


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserAdmin(BaseUserAdmin):
    list_display  = [
        'avatar_tag', 'email', 'full_name', 'role_badge',
        'is_active_icon', 'enrollment_count', 'course_count', 'created_at',
    ]
    list_display_links = ['email', 'full_name']
    list_filter   = ['role', 'is_active', 'is_staff', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    ordering      = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'avatar_tag', 'full_name']
    actions       = ['activate_users', 'deactivate_users', 'make_staff']
    list_per_page = 25
    date_hierarchy = 'created_at'
    show_full_result_count = True

    fieldsets = (
        ('Login Credentials', {
            'fields': ('email', 'password'),
        }),
        ('Personal Info', {
            'fields': ('avatar_tag', 'first_name', 'last_name', 'avatar'),
        }),
        ('Role & Access', {
            'description': (
                '<strong>role</strong> controls platform permissions. '
                '<strong>is_staff</strong> grants Django admin access. '
                '<strong>is_superuser</strong> bypasses all permission checks.'
            ),
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser'),
        }),
        ('Django Permissions', {
            'classes': ('collapse',),
            'fields': ('groups', 'user_permissions'),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    def get_inlines(self, request, obj=None):
        if obj is None:
            return []
        if obj.role == User.Role.TEACHER:
            return [TeacherProfileInline]
        if obj.role == User.Role.STUDENT:
            return [StudentProfileInline]
        return []

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _enrollment_count=Count('enrollments', distinct=True),
            _course_count=Count('courses', distinct=True),
        )

    @admin.display(description='Avatar')
    def avatar_tag(self, obj):
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />',
                obj.avatar.url
            )
        initials = f"{obj.first_name[:1]}{obj.last_name[:1]}".upper()
        colors = {
            'super_admin': '#7c3aed', 'admin': '#2563eb',
            'teacher': '#059669', 'student': '#d97706',
        }
        color = colors.get(obj.role, '#6b7280')
        return format_html(
            '<div style="width:36px;height:36px;border-radius:50%;background:{};'
            'display:flex;align-items:center;justify-content:center;'
            'color:white;font-weight:700;font-size:12px;">{}</div>',
            color, initials
        )

    @admin.display(description='Role')
    def role_badge(self, obj):
        colors = {
            'super_admin': ('#7c3aed', '#ede9fe'),
            'admin':       ('#2563eb', '#dbeafe'),
            'teacher':     ('#059669', '#d1fae5'),
            'student':     ('#d97706', '#fef3c7'),
        }
        fg, bg = colors.get(obj.role, ('#6b7280', '#f3f4f6'))
        return format_html(
            '<span style="background:{};color:{};padding:2px 10px;border-radius:12px;'
            'font-size:11px;font-weight:600;">{}</span>',
            bg, fg, obj.get_role_display()
        )

    @admin.display(description='Active', boolean=False)
    def is_active_icon(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#059669;font-size:16px;">✓</span>')
        return format_html('<span style="color:#dc2626;font-size:16px;">✗</span>')

    @admin.display(description='Enrollments', ordering='_enrollment_count')
    def enrollment_count(self, obj):
        return obj._enrollment_count

    @admin.display(description='Courses', ordering='_course_count')
    def course_count(self, obj):
        return obj._course_count

    # ── Actions ──────────────────────────────────────────────────────────
    @admin.action(description='✓ Activate selected users')
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} user(s) activated.')

    @admin.action(description='✗ Deactivate selected users')
    def deactivate_users(self, request, queryset):
        # Prevent deactivating yourself
        updated = queryset.exclude(pk=request.user.pk).update(is_active=False)
        self.message_user(request, f'{updated} user(s) deactivated.')

    @admin.action(description='⚙ Grant staff (admin) access')
    def make_staff(self, request, queryset):
        updated = queryset.update(is_staff=True)
        self.message_user(request, f'{updated} user(s) granted staff access.')


# ---------------------------------------------------------------------------
# TeacherProfile
# ---------------------------------------------------------------------------
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'expertise', 'website', 'course_count']
    search_fields = ['user__email', 'user__first_name', 'expertise']
    raw_id_fields = ['user']
    list_per_page = 25

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').annotate(
            _course_count=Count('user__courses', distinct=True)
        )

    @admin.display(description='Courses', ordering='_course_count')
    def course_count(self, obj):
        return obj._course_count


# ---------------------------------------------------------------------------
# StudentProfile
# ---------------------------------------------------------------------------
class StudentProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'bio_preview']
    search_fields = ['user__email', 'user__first_name']
    raw_id_fields = ['user']
    list_per_page = 25

    @admin.display(description='Bio')
    def bio_preview(self, obj):
        return (obj.bio[:80] + '…') if len(obj.bio) > 80 else obj.bio or '—'
