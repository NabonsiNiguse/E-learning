from django.db import models
from django.conf import settings


class Faculty(models.Model):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=10, unique=True)
    dean = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deaned_faculties',
        limit_choices_to={'role': 'dean'},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'faculties'
        verbose_name_plural = 'Faculties'

    def __str__(self):
        return self.name


class Department(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, unique=True)
    head = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments',
        limit_choices_to={'role': 'dept_head'},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'

    def __str__(self):
        return self.name


class Course(models.Model):
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED  = 'archived',  'Archived'

    department   = models.ForeignKey(
        Department,
        on_delete=models.RESTRICT,
        related_name='courses',
        null=True,
    )
    title        = models.CharField(max_length=255)
    slug         = models.SlugField(max_length=255, unique=True)
    description  = models.TextField()
    level        = models.CharField(max_length=50, default='Beginner', blank=True)
    credits      = models.PositiveSmallIntegerField(default=3)
    thumbnail    = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    status       = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    is_premium   = models.BooleanField(default=False)
    price        = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    category     = models.CharField(max_length=100, blank=True)
    tags         = models.CharField(max_length=255, blank=True, help_text='Comma-separated tags')
    locked       = models.BooleanField(default=False, help_text='If True, no more grade changes allowed.')
    results_submitted_at = models.DateTimeField(null=True, blank=True, help_text='When final results were submitted.')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='courses_created', editable=False,
    )

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def __init__(self, *args, **kwargs):
        level = kwargs.pop('level', None)
        super().__init__(*args, **kwargs)
        if level is not None:
            try:
                setattr(self, 'level', level)
            except Exception:
                pass

    @property
    def lesson_count(self):
        return self.lessons.count()

    @property
    def enrolled_count(self):
        # Count unique students enrolled in active offerings of this course
        from enrollments.models import Enrollment
        return Enrollment.objects.filter(course_offering__course=self, status='active').count()


class AcademicSemester(models.Model):
    year = models.PositiveIntegerField()
    semester = models.CharField(max_length=50)  # 'Fall', 'Spring', 'Summer'
    is_active = models.BooleanField(default=False)
    registration_start = models.DateTimeField(null=True, blank=True)
    registration_end = models.DateTimeField(null=True, blank=True)
    grade_lock_deadline = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'academic_semesters'
        unique_together = ('year', 'semester')

    def __str__(self):
        return f"{self.semester} {self.year}"


class CourseOffering(models.Model):
    course = models.ForeignKey(Course, on_delete=models.RESTRICT, related_name='offerings')
    semester = models.ForeignKey(AcademicSemester, on_delete=models.RESTRICT, related_name='offerings')
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='course_offerings',
        limit_choices_to={'role': 'teacher'},
    )
    section_code = models.CharField(max_length=10)  # e.g., 'A', 'B'
    max_capacity = models.PositiveIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'course_offerings'
        unique_together = ('course', 'semester', 'section_code')

    def __str__(self):
        return f"{self.course.title} - Section {self.section_code} ({self.semester})"


class Lesson(models.Model):
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        PUBLISHED = 'published', 'Published'

    course       = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title        = models.CharField(max_length=255)
    description  = models.TextField(blank=True)
    video_url    = models.URLField(blank=True)
    file_url     = models.URLField(blank=True)
    order        = models.PositiveIntegerField(default=0)
    status       = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    duration_min = models.PositiveIntegerField(default=0, help_text='Duration in minutes')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='lessons_created', editable=False,
    )

    class Meta:
        db_table = 'lessons'
        ordering = ['order']
        unique_together = [('course', 'order')]

    def __str__(self):
        return f'{self.course.title} — {self.title}'
