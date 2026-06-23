from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import GradingScale, GradingRule, AssessmentTemplate, AssessmentScore, Grade, AcademicAuditLog, GradeAppeal


class GradingRuleInline(admin.TabularInline):
    model   = GradingRule
    extra   = 0
    fields  = ['letter', 'min_score', 'max_score', 'gpa_points', 'pass_fail']
    ordering = ['-min_score']


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


class AssessmentTemplateAdmin(admin.ModelAdmin):
    list_display = ['course_offering', 'name', 'max_score', 'weight_percentage']
    list_filter = ['name']
    search_fields = ['course_offering__course__title', 'name']


class AssessmentScoreAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'template', 'score_obtained', 'version', 'graded_by', 'graded_at']
    list_filter = ['template__name']
    search_fields = ['enrollment__student__email', 'template__name']
    readonly_fields = ['graded_at']


class GradeAdmin(admin.ModelAdmin):
    list_display  = [
        'student_link', 'course_link',
        'raw_total_score', 'grade_display', 'status_badge', 'updated_at',
    ]
    list_filter   = ['status', 'enrollment__course_offering__course__category']
    search_fields = ['enrollment__student__email', 'enrollment__student__first_name', 'enrollment__course_offering__course__title']
    readonly_fields = ['updated_at']
    raw_id_fields = ['enrollment']
    list_per_page  = 30
    save_on_top    = True
    actions        = ['approve_grades', 'unlock_grades']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('enrollment__student', 'enrollment__course_offering__course')

    @admin.display(description='Student')
    def student_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.enrollment.student_id, obj.enrollment.student.full_name
        )

    @admin.display(description='Course')
    def course_link(self, obj):
        return format_html(
            '<a href="/admin/courses/course/{}/change/">{}</a>',
            obj.enrollment.course_offering.course_id, obj.enrollment.course_offering.course.title
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
            'locked':    ('background:#dbeafe;color:#1e40af', '→ Locked'),
            'released':  ('background:#d1fae5;color:#065f46', '✓ Released'),
        }
        style, label = styles.get(obj.status, ('background:#f3f4f6;color:#374151', obj.status))
        return format_html(
            '<span style="{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            style, label
        )

    @admin.action(description='✓ Approve/Release selected grades')
    def approve_grades(self, request, queryset):
        updated = queryset.filter(status='locked').update(
            status=Grade.Status.RELEASED,
        )
        self.message_user(request, f'{updated} grade(s) released.')

    @admin.action(description='↩ Unlock selected grades for draft edits')
    def unlock_grades(self, request, queryset):
        updated = queryset.filter(status__in=['locked', 'released']).update(
            status=Grade.Status.DRAFT,
        )
        self.message_user(request, f'{updated} grade(s) unlocked to draft.')


class AcademicAuditLogAdmin(admin.ModelAdmin):
    list_display  = ['table_name', 'record_id', 'action', 'changed_by', 'timestamp']
    list_filter   = ['action', 'table_name', 'timestamp']
    search_fields = ['changed_by__email']
    readonly_fields = ['table_name', 'record_id', 'action', 'old_value', 'new_value', 'changed_by', 'ip_address', 'timestamp']
    date_hierarchy = 'timestamp'
    list_per_page  = 40

    def has_add_permission(self, request):    return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


class GradeAppealAdmin(admin.ModelAdmin):
    list_display  = [
        'student_link', 'grade_link', 'status_badge',
        'teacher_reviewed_by_display', 'override_by_display', 'created_at',
    ]
    list_filter   = ['status', 'created_at']
    search_fields = ['student__email', 'student__first_name']
    readonly_fields = [
        'student', 'grade', 'reason',
        'teacher_reviewed_by', 'teacher_reviewed_at',
        'override_by', 'override_at',
        'created_at', 'updated_at',
    ]
    raw_id_fields = ['grade']
    date_hierarchy = 'created_at'
    list_per_page  = 25

    fieldsets = (
        ('Appeal', {
            'fields': ('student', 'grade', 'reason', 'status'),
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

    @admin.display(description='Grade')
    def grade_link(self, obj):
        return format_html(
            '<a href="/admin/results/grade/{}/change/">Grade #{}</a>',
            obj.grade_id, obj.grade_id
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
