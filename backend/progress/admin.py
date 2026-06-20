"""
Progress admin — lesson completion tracking per student.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Progress


class ProgressAdmin(admin.ModelAdmin):
    list_display  = [
        'student_link', 'lesson_display', 'course_display',
        'completed_badge', 'completed_at',
    ]
    list_filter   = ['completed', 'lesson__course__category', 'completed_at']
    search_fields = [
        'student__email', 'student__first_name',
        'lesson__title', 'lesson__course__title',
    ]
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    raw_id_fields   = ['student', 'lesson']
    list_per_page   = 40
    date_hierarchy  = 'completed_at'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'student', 'lesson', 'lesson__course'
        )

    @admin.display(description='Student')
    def student_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.student_id, obj.student.full_name
        )

    @admin.display(description='Lesson')
    def lesson_display(self, obj):
        return obj.lesson.title

    @admin.display(description='Course')
    def course_display(self, obj):
        return format_html(
            '<a href="/admin/courses/course/{}/change/">{}</a>',
            obj.lesson.course_id, obj.lesson.course.title
        )

    @admin.display(description='Completed', boolean=True)
    def completed_badge(self, obj):
        return obj.completed
