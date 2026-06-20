"""
Enrollments admin — student-course enrollment management with status
lifecycle, bulk actions, and data integrity enforcement.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import Enrollment


class EnrollmentAdmin(admin.ModelAdmin):
    list_display  = [
        'student_link', 'course_link', 'status_badge',
        'enrolled_at', 'completed_at', 'progress_pct',
    ]
    list_filter   = ['status', 'course__category', 'enrolled_at']
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name',
        'course__title',
    ]
    readonly_fields = ['enrolled_at', 'updated_at', 'completed_at']
    raw_id_fields   = ['student', 'course']
    date_hierarchy  = 'enrolled_at'
    list_per_page   = 30
    actions         = ['activate_enrollments', 'lock_enrollments', 'mark_completed']

    fieldsets = (
        ('Enrollment', {
            'fields': ('student', 'course', 'status'),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('enrolled_at', 'updated_at', 'completed_at'),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('student', 'course')

    @admin.display(description='Student')
    def student_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.student_id, obj.student.full_name
        )

    @admin.display(description='Course')
    def course_link(self, obj):
        return format_html(
            '<a href="/admin/courses/course/{}/change/">{}</a>',
            obj.course_id, obj.course.title
        )

    @admin.display(description='Status')
    def status_badge(self, obj):
        styles = {
            'active':    ('background:#d1fae5;color:#065f46', 'Active'),
            'pending':   ('background:#fef3c7;color:#92400e', 'Pending'),
            'completed': ('background:#dbeafe;color:#1e40af', 'Completed'),
            'locked':    ('background:#fee2e2;color:#991b1b', 'Locked'),
        }
        style, label = styles.get(obj.status, ('background:#f3f4f6;color:#374151', obj.status))
        return format_html(
            '<span style="{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            style, label
        )

    @admin.display(description='Progress')
    def progress_pct(self, obj):
        total = obj.course.lessons.count()
        if not total:
            return '—'
        done = obj.student.progress_records.filter(
            lesson__course=obj.course, completed=True
        ).count()
        pct = int(done / total * 100)
        color = '#059669' if pct == 100 else '#2563eb' if pct > 50 else '#d97706'
        return format_html(
            '<div style="display:flex;align-items:center;gap:6px;">'
            '<div style="width:80px;height:6px;background:#e5e7eb;border-radius:3px;">'
            '<div style="width:{}%;height:100%;background:{};border-radius:3px;"></div>'
            '</div>'
            '<span style="font-size:11px;color:{};">{}</span>'
            '</div>',
            pct, color, color, f'{pct}%'
        )

    # ── Actions ──────────────────────────────────────────────────────────
    @admin.action(description='✓ Activate selected enrollments')
    def activate_enrollments(self, request, queryset):
        updated = queryset.update(status=Enrollment.Status.ACTIVE)
        self.message_user(request, f'{updated} enrollment(s) activated.')

    @admin.action(description='✗ Lock selected enrollments')
    def lock_enrollments(self, request, queryset):
        updated = queryset.update(status=Enrollment.Status.LOCKED)
        self.message_user(request, f'{updated} enrollment(s) locked.')

    @admin.action(description='★ Mark as completed')
    def mark_completed(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status=Enrollment.Status.COMPLETED, completed_at=timezone.now())
        self.message_user(request, f'{updated} enrollment(s) marked completed.')
