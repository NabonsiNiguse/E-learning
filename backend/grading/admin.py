"""
Grading admin — immutable grade correction audit log.
GradeAppeal lives in the results app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import GradeCorrection


class GradeCorrectionAdmin(admin.ModelAdmin):
    list_display  = [
        'submission_id', 'student_link', 'corrected_by_link',
        'role_badge', 'score_change', 'created_at',
    ]
    list_filter   = ['corrected_by_role', 'created_at']
    search_fields = [
        'submission_id', 'assignment_id',
        'student__email', 'student__first_name',
        'corrected_by__email',
    ]
    readonly_fields = [
        'submission_id', 'assignment_id',
        'student', 'corrected_by', 'corrected_by_role',
        'old_score', 'new_score', 'reason', 'created_at',
    ]
    date_hierarchy = 'created_at'
    list_per_page  = 30

    # Fully immutable — audit log
    def has_add_permission(self, request):              return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

    @admin.display(description='Student')
    def student_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.student_id, obj.student.full_name
        )

    @admin.display(description='Corrected By')
    def corrected_by_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.corrected_by_id, obj.corrected_by.full_name
        )

    @admin.display(description='Role')
    def role_badge(self, obj):
        colors = {
            'teacher':     ('#059669', '#d1fae5'),
            'super_admin': ('#7c3aed', '#ede9fe'),
        }
        fg, bg = colors.get(obj.corrected_by_role, ('#6b7280', '#f3f4f6'))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">{}</span>',
            bg, fg, obj.corrected_by_role.replace('_', ' ').title()
        )

    @admin.display(description='Score Change')
    def score_change(self, obj):
        diff  = float(obj.new_score) - float(obj.old_score)
        color = '#059669' if diff >= 0 else '#dc2626'
        sign  = '+' if diff >= 0 else ''
        return format_html(
            '<span style="color:{};font-weight:600;">{} → {} ({}{})</span>',
            color, obj.old_score, obj.new_score, sign, round(diff, 2)
        )
