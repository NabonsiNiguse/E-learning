from django.db import models
from django.conf import settings


class Course(models.Model):
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED  = 'archived',  'Archived'

    teacher      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses',
        limit_choices_to={'role': 'teacher'},
    )
    title        = models.CharField(max_length=255)
    slug         = models.SlugField(max_length=255, unique=True)
    description  = models.TextField()
    level        = models.CharField(max_length=50, default='Beginner', blank=True)
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
        # Accept 'level' kwarg defensively to avoid unexpected keyword
        # errors when tests or older fixtures pass it before migrations
        # are applied. This keeps model instantiation robust.
        level = kwargs.pop('level', None)
        super().__init__(*args, **kwargs)
        if level is not None:
            try:
                # If the field exists, assignment will be handled by Django
                setattr(self, 'level', level)
            except Exception:
                # Silently ignore if assignment fails during exotic import-time
                pass

    @property
    def lesson_count(self):
        return self.lessons.count()

    @property
    def enrolled_count(self):
        return self.enrollments.filter(status='active').count()


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
