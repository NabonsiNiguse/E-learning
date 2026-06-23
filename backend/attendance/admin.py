from django.contrib import admin
from django.utils.html import format_html
from .models import AttendanceRecord


class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display  = [
        'student_link', 'course_offering_link', 'date',
        'status_badge', 'marked_by_display', 'notes_preview',
    ]
    list_filter   = ['status', 'course_offering', 'date']
    search_fields = [
        'student__email', 'student__first_name',
        'student__last_name', 'course_offering__course__title',
    ]
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields   = ['student', 'course_offering', 'marked_by']
    date_hierarchy  = 'date'
    list_per_page   = 40
    actions         = ['mark_present', 'mark_absent', 'mark_excused']

    fieldsets = (
        ('Attendance', {
            'fields': ('student', 'course_offering', 'date', 'status', 'notes'),
        }),
        ('Recorded By', {
            'fields': ('marked_by',),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('student', 'course_offering__course', 'marked_by')

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
            'present': ('background:#d1fae5;color:#065f46', '✓ Present'),
            'absent':  ('background:#fee2e2;color:#991b1b', '✗ Absent'),
            'late':    ('background:#fef3c7;color:#92400e', '⏰ Late'),
            'excused': ('background:#dbeafe;color:#1e40af', '○ Excused'),
        }
        style, label = styles.get(obj.status, ('background:#f3f4f6;color:#374151', obj.status))
        return format_html(
            '<span style="{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            style, label
        )

    @admin.display(description='Marked By')
    def marked_by_display(self, obj):
        if obj.marked_by:
            return obj.marked_by.full_name
        return format_html('<em style="color:#9ca3af;">—</em>')

    @admin.display(description='Notes')
    def notes_preview(self, obj):
        return (obj.notes[:60] + '…') if len(obj.notes) > 60 else obj.notes or '—'

    @admin.action(description='✓ Mark selected as Present')
    def mark_present(self, request, queryset):
        updated = queryset.update(status='present')
        self.message_user(request, f'{updated} record(s) marked as present.')

    @admin.action(description='✗ Mark selected as Absent')
    def mark_absent(self, request, queryset):
        updated = queryset.update(status='absent')
        self.message_user(request, f'{updated} record(s) marked as absent.')

    @admin.action(description='○ Mark selected as Excused')
    def mark_excused(self, request, queryset):
        updated = queryset.update(status='excused')
        self.message_user(request, f'{updated} record(s) marked as excused.')
