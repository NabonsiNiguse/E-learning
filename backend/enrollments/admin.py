from django.contrib import admin
from django.utils.html import format_html
from .models import Enrollment


class EnrollmentAdmin(admin.ModelAdmin):
    list_display  = [
        'student_link', 'course_offering_link', 'status_badge',
        'enrolled_at', 'completed_at', 'progress_pct',
    ]
    list_filter   = ['status', 'course_offering__course__category', 'enrolled_at']
    search_fields = [
        'student__email', 'student__first_name', 'student__last_name',
        'course_offering__course__title',
    ]
    readonly_fields = ['enrolled_at', 'updated_at', 'completed_at']
    raw_id_fields   = ['student', 'course_offering']
    date_hierarchy  = 'enrolled_at'
    list_per_page   = 30
    actions         = ['activate_enrollments', 'lock_enrollments', 'mark_completed']

    fieldsets = (
        ('Enrollment', {
            'fields': ('student', 'course_offering', 'status'),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('enrolled_at', 'updated_at', 'completed_at'),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('student', 'course_offering__course')

    @admin.display(description='Student')
    def student_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.student_id, obj.student.full_name
        )

    @admin.display(description='Course Offering')
    def course_offering_link(self, obj):
        if obj.course_offering:
            return format_html(
                '<a href="/admin/courses/courseoffering/{}/change/">{}</a>',
                obj.course_offering_id, obj.course_offering
            )
        return '—'

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
        if not obj.course_offering or not obj.course_offering.course:
            return '—'
        total = obj.course_offering.course.lessons.count()
        if not total:
            return '—'
        done = obj.student.progress_records.filter(
            lesson__course=obj.course_offering.course, completed=True
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
