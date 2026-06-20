from django.db import models
from django.conf import settings


class Progress(models.Model):
    """Tracks which lessons a student has completed."""
    student      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progress_records',
    )
    lesson       = models.ForeignKey(
        'courses.Lesson',
        on_delete=models.CASCADE,
        related_name='progress_records',
    )
    completed    = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'progress'
        unique_together = [('student', 'lesson')]   # one record per student per lesson
        ordering        = ['lesson__order']

    def __str__(self):
        status = 'done' if self.completed else 'pending'
        return f'{self.student.email} — {self.lesson.title} [{status}]'
