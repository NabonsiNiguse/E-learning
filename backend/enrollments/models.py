from django.db import models
from django.conf import settings


class Enrollment(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        ACTIVE    = 'active',    'Active'
        COMPLETED = 'completed', 'Completed'
        LOCKED    = 'locked',    'Locked'   # premium course, payment pending

    student    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'student'},
    )
    course     = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    status     = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table        = 'enrollments'
        unique_together = [('student', 'course')]   # prevent duplicate enrollments
        ordering        = ['-enrolled_at']

    def __str__(self):
        return f'{self.student.email} → {self.course.title} [{self.status}]'
