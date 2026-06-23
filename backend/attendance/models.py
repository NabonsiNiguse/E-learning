from django.db import models
from django.conf import settings
from courses.models import CourseOffering


class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        ABSENT  = 'absent',  'Absent'
        LATE    = 'late',    'Late'
        EXCUSED = 'excused', 'Excused'

    student    = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        limit_choices_to={'role': 'student'},
    )
    course_offering = models.ForeignKey(
        CourseOffering,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        null=True,
    )
    marked_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='attendance_marked',
        limit_choices_to={'role': 'teacher'},
    )
    date       = models.DateField()
    status     = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
    notes      = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'attendance_records'
        unique_together = [('student', 'course_offering', 'date')]
        ordering        = ['-date', 'student__first_name']

    def __str__(self):
        return f'{self.student.email} | {self.course_offering} | {self.date} | {self.status}'
