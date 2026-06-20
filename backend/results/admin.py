"""
Results admin — grading scales, student results, audit logs, and appeals.
Full data integrity: results lock after submission, audit log is immutable.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Avg, Count
from .models import GradingScale, GradingRule, StudentResult, ResultAuditLog, GradeAppeal


# ---------------------------------------------------------------------------
# GradingRule inline
# ---------------------------------------------------------------------------
class GradingRuleInline(admin.TabularInline):
    model   = GradingRule
    extra   = 0
    fields  = ['letter', 'min_score', 'max_score', 'gpa_points', 'pass_fail']
    ordering = ['-min_score']


# ---------------------------------------------------------------------------
# GradingScale
# ---------------------------------------------------------------------------
class GradingScaleAdmin(admin.ModelAdmin):
    list_display  = ['name', 'is_active_badge', 'rule_count', 'created_at']
    list_filter   = ['is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    inlines       = [GradingRuleInline]
    save_on_top   = True

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_rule_count=Count('rules'))

    @admin.display(description='Active')
    def is_active_badge(self, obj):
        if obj.is_active:
            return format_html(
                '<span style="background:#d1fae5;color:#065f46;padding:2px 10px;'
                'border-radius:12px;font-size:11px;font-weight:600;">✓ Active</span>'
            )
        return format_html('<span style="color:#9ca3af;font-size:12px;">Inactive</span>')

    @admin.display(description='Rules', ordering='_rule_count')
    def rule_count(self, obj):
        return obj._rule_count


# ---------------------------------------------------------------------------
# StudentResult
# ---------------------------------------------------------------------------
class StudentResultAdmin(admin.ModelAdmin):
    list_display  = [
        'student_link', 'course_link', 'year', 'semester',
        'raw_score', 'grade_display', 'status_badge', 'created_at',
    ]
    list_filter   = ['status', 'year', 'semester', 'course__category']
    search_fields = ['student__email', 'student__first_name', 'course__title']
    readonly_fields = [
        'created_at', 'updated_at',
        'submitted_at', 'submitted_by',
        'approved_at', 'approved_by',
        'unlocked_at', 'unlocked_by',
    ]
    raw_id_fields = ['student', 'course', 'submitted_by', 'approved_by', 'unlocked_by']
    date_hierarchy = 'created_at'
    list_per_page  = 30
    save_on_top    = True
    actions        = ['approve_results', 'unlock_results']

    fieldsets = (
        ('Result', {
            'fields': ('student', 'course', 'year', 'semester', 'raw_score', 'status'),
        }),
        ('Workflow', {
            'classes': ('collapse',),
            'fields': (
                'submitted_at', 'submitted_by',
                'approved_at', 'approved_by',
                'unlocked_at', 'unlocked_by',
            ),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
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

    @admin.display(description='Grade')
    def grade_display(self, obj):
        grade = obj.compute_grade()
        if not grade:
            return format_html('<span style="color:#9ca3af;">—</span>')
        color = '#059669' if grade['pass_fail'] == 'pass' else '#dc2626'
        return format_html(
            '<span style="color:{};font-weight:700;">{}</span> '
            '<span style="color:#6b7280;font-size:11px;">({} GPA)</span>',
            color, grade['letter'], grade['gpa']
        )

    @admin.display(description='Status')
    def status_badge(self, obj):
        styles = {
            'draft':     ('background:#fef3c7;color:#92400e', '○ Draft'),
            'submitted': ('background:#dbeafe;color:#1e40af', '→ Submitted'),
            'approved':  ('background:#d1fae5;color:#065f46', '✓ Approved'),
            'unlocked':  ('background:#ede9fe;color:#5b21b6', '↩ Unlocked'),
        }
        style, label = styles.get(obj.status, ('background:#f3f4f6;color:#374151', obj.status))
        return format_html(
            '<span style="{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            style, label
        )

    @admin.action(description='✓ Approve selected results')
    def approve_results(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='submitted').update(
            status=StudentResult.Status.APPROVED,
            approved_at=timezone.now(),
            approved_by=request.user,
        )
        self.message_user(request, f'{updated} result(s) approved.')

    @admin.action(description='↩ Unlock selected results for correction')
    def unlock_results(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status__in=['submitted', 'approved']).update(
            status=StudentResult.Status.UNLOCKED,
            unlocked_at=timezone.now(),
            unlocked_by=request.user,
        )
        self.message_user(request, f'{updated} result(s) unlocked.')


# ---------------------------------------------------------------------------
# ResultAuditLog — immutable
# ---------------------------------------------------------------------------
class ResultAuditLogAdmin(admin.ModelAdmin):
    list_display  = ['result_link', 'action_badge', 'performed_by_link', 'role', 'timestamp']
    list_filter   = ['action', 'performed_by_role', 'timestamp']
    search_fields = ['performed_by__email', 'result__student__email']
    readonly_fields = ['result', 'action', 'performed_by', 'performed_by_role',
                       'old_value', 'new_value', 'note', 'timestamp']
    date_hierarchy = 'timestamp'
    list_per_page  = 40

    def has_add_permission(self, request):    return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

    @admin.display(description='Result')
    def result_link(self, obj):
        return format_html(
            '<a href="/admin/results/studentresult/{}/change/">Result #{}</a>',
            obj.result_id, obj.result_id
        )

    @admin.display(description='Action')
    def action_badge(self, obj):
        colors = {
            'created':   ('#059669', '#d1fae5'),
            'score_set': ('#2563eb', '#dbeafe'),
            'submitted': ('#d97706', '#fef3c7'),
            'approved':  ('#059669', '#d1fae5'),
            'unlocked':  ('#7c3aed', '#ede9fe'),
            'deleted':   ('#dc2626', '#fee2e2'),
        }
        fg, bg = colors.get(obj.action, ('#6b7280', '#f3f4f6'))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">{}</span>',
            bg, fg, obj.action.replace('_', ' ').title()
        )

    @admin.display(description='By')
    def performed_by_link(self, obj):
        if obj.performed_by:
            return format_html(
                '<a href="/admin/users/user/{}/change/">{}</a>',
                obj.performed_by_id, obj.performed_by.full_name
            )
        return '—'

    @admin.display(description='Role')
    def role(self, obj):
        return obj.performed_by_role.replace('_', ' ').title()


# ---------------------------------------------------------------------------
# GradeAppeal
# ---------------------------------------------------------------------------
class GradeAppealAdmin(admin.ModelAdmin):
    list_display  = [
        'student_link', 'result_link', 'status_badge',
        'teacher_reviewed_by_display', 'override_by_display', 'created_at',
    ]
    list_filter   = ['status', 'created_at']
    search_fields = ['student__email', 'student__first_name']
    readonly_fields = [
        'student', 'result', 'reason',
        'teacher_reviewed_by', 'teacher_reviewed_at',
        'override_by', 'override_at',
        'created_at', 'updated_at',
    ]
    raw_id_fields = ['result']
    date_hierarchy = 'created_at'
    list_per_page  = 25

    fieldsets = (
        ('Appeal', {
            'fields': ('student', 'result', 'reason', 'status'),
        }),
        ('Teacher Review', {
            'fields': ('teacher_response', 'teacher_reviewed_by', 'teacher_reviewed_at'),
        }),
        ('Override', {
            'fields': ('override_score', 'override_reason', 'override_by', 'override_at'),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    @admin.display(description='Student')
    def student_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.student_id, obj.student.full_name
        )

    @admin.display(description='Result')
    def result_link(self, obj):
        return format_html(
            '<a href="/admin/results/studentresult/{}/change/">Result #{}</a>',
            obj.result_id, obj.result_id
        )

    @admin.display(description='Status')
    def status_badge(self, obj):
        styles = {
            'pending':   ('background:#fef3c7;color:#92400e', '⏳ Pending'),
            'reviewed':  ('background:#dbeafe;color:#1e40af', '👁 Reviewed'),
            'escalated': ('background:#ede9fe;color:#5b21b6', '⬆ Escalated'),
            'approved':  ('background:#d1fae5;color:#065f46', '✓ Approved'),
            'rejected':  ('background:#fee2e2;color:#991b1b', '✗ Rejected'),
        }
        style, label = styles.get(obj.status, ('background:#f3f4f6;color:#374151', obj.status))
        return format_html(
            '<span style="{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            style, label
        )

    @admin.display(description='Teacher Reviewer')
    def teacher_reviewed_by_display(self, obj):
        return obj.teacher_reviewed_by.full_name if obj.teacher_reviewed_by else '—'

    @admin.display(description='Override By')
    def override_by_display(self, obj):
        return obj.override_by.full_name if obj.override_by else '—'
