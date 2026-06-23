from django.contrib import admin
from django.utils.html import format_html
from .models import Faculty, Department, Course, AcademicSemester, CourseOffering, Lesson


class FacultyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'dean', 'created_at']
    search_fields = ['name', 'code']


class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'faculty', 'head', 'created_at']
    list_filter = ['faculty']
    search_fields = ['name', 'code']


class AcademicSemesterAdmin(admin.ModelAdmin):
    list_display = ['year', 'semester', 'is_active', 'registration_start', 'registration_end']
    list_filter = ['is_active']
    search_fields = ['semester']


class CourseOfferingAdmin(admin.ModelAdmin):
    list_display = ['course', 'semester', 'instructor', 'section_code', 'max_capacity']
    list_filter = ['semester', 'section_code']
    search_fields = ['course__title', 'instructor__email']


class LessonInline(admin.TabularInline):
    model    = Lesson
    extra    = 0
    fields   = ['order', 'title', 'status', 'duration_min', 'video_url']
    ordering = ['order']
    show_change_link = True


class CourseAdmin(admin.ModelAdmin):
    list_display = [
        'thumbnail_tag', 'title', 'department_link', 'category',
        'status_badge', 'premium_badge', 'price',
        'lesson_count_col', 'created_at',
    ]
    list_display_links = ['thumbnail_tag', 'title']
    list_filter   = ['status', 'is_premium', 'category', 'created_at']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields     = ['thumbnail_tag', 'created_at', 'updated_at', 'lesson_count_col']
    raw_id_fields       = ['department', 'created_by']
    inlines             = [LessonInline]
    list_per_page       = 20
    date_hierarchy      = 'created_at'
    save_on_top         = True
    actions             = ['publish_courses', 'archive_courses', 'unpublish_courses']

    fieldsets = (
        ('Course Info', {
            'fields': ('title', 'slug', 'description', 'category', 'tags'),
        }),
        ('Thumbnail', {
            'fields': ('thumbnail_tag', 'thumbnail'),
        }),
        ('Ownership', {
            'fields': ('department', 'created_by'),
        }),
        ('Pricing & Access', {
            'fields': ('is_premium', 'price', 'status', 'locked'),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('department')

    @admin.display(description='')
    def thumbnail_tag(self, obj):
        if obj.thumbnail:
            src = str(obj.thumbnail)
            if not src.startswith('http'):
                src = obj.thumbnail.url
            return format_html(
                '<img src="{}" style="width:64px;height:40px;object-fit:cover;'
                'border-radius:6px;border:1px solid #e5e7eb;" />',
                src
            )
        return format_html(
            '<div style="width:64px;height:40px;border-radius:6px;background:#f3f4f6;'
            'display:flex;align-items:center;justify-content:center;'
            'font-size:18px;">📚</div>'
        )

    @admin.display(description='Department')
    def department_link(self, obj):
        if obj.department:
            return format_html(
                '<a href="/admin/courses/department/{}/change/">{}</a>',
                obj.department_id, obj.department.name
            )
        return '—'

    @admin.display(description='Status')
    def status_badge(self, obj):
        styles = {
            'published': ('background:#d1fae5;color:#065f46', '● Published'),
            'draft':     ('background:#fef3c7;color:#92400e', '○ Draft'),
            'archived':  ('background:#f3f4f6;color:#6b7280', '✕ Archived'),
        }
        style, label = styles.get(obj.status, ('background:#f3f4f6;color:#6b7280', obj.status))
        return format_html(
            '<span style="{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            style, label
        )

    @admin.display(description='Premium')
    def premium_badge(self, obj):
        if obj.is_premium:
            return format_html('<span style="color:#d97706;font-weight:700;">★ Premium</span>')
        return format_html('<span style="color:#9ca3af;">Free</span>')

    @admin.display(description='Lessons')
    def lesson_count_col(self, obj):
        return obj.lessons.count()

    @admin.action(description='● Publish selected courses')
    def publish_courses(self, request, queryset):
        updated = queryset.update(status=Course.Status.PUBLISHED)
        self.message_user(request, f'{updated} course(s) published.')

    @admin.action(description='○ Unpublish (set to draft)')
    def unpublish_courses(self, request, queryset):
        updated = queryset.update(status=Course.Status.DRAFT)
        self.message_user(request, f'{updated} course(s) set to draft.')

    @admin.action(description='✕ Archive selected courses')
    def archive_courses(self, request, queryset):
        updated = queryset.update(status=Course.Status.ARCHIVED)
        self.message_user(request, f'{updated} course(s) archived.')


class LessonAdmin(admin.ModelAdmin):
    list_display  = ['title', 'course_link', 'order', 'status_badge', 'duration_min', 'has_video']
    list_filter   = ['status', 'course__category', 'course__status']
    search_fields = ['title', 'course__title']
    ordering      = ['course', 'order']
    raw_id_fields = ['course', 'created_by']
    list_per_page = 30
    actions       = ['publish_lessons', 'draft_lessons']

    @admin.display(description='Course')
    def course_link(self, obj):
        return format_html(
            '<a href="/admin/courses/course/{}/change/">{}</a>',
            obj.course_id, obj.course.title
        )

    @admin.display(description='Status')
    def status_badge(self, obj):
        if obj.status == 'published':
            return format_html('<span style="color:#059669;font-weight:600;">● Published</span>')
        return format_html('<span style="color:#d97706;font-weight:600;">○ Draft</span>')

    @admin.display(description='Video', boolean=True)
    def has_video(self, obj):
        return bool(obj.video_url)

    @admin.action(description='● Publish selected lessons')
    def publish_lessons(self, request, queryset):
        updated = queryset.update(status=Lesson.Status.PUBLISHED)
        self.message_user(request, f'{updated} lesson(s) published.')

    @admin.action(description='○ Set to draft')
    def draft_lessons(self, request, queryset):
        updated = queryset.update(status=Lesson.Status.DRAFT)
        self.message_user(request, f'{updated} lesson(s) set to draft.')
