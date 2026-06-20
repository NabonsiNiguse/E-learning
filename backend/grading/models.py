"""
Grading models — grade corrections, appeals, and audit trail.

Role rules enforced here:
  Teacher     : can correct grades on their own students' submissions.
  Super Admin : can override any grade; reason + audit log required.
  Admin       : read-only access to all grade data; cannot change grades.
  Student     : can submit an appeal; cannot edit grades.
"""
from django.db import models
from django.conf import settings


class GradeCorrection(models.Model):
    """
    Records every grade change made by a Teacher (own course) or
    Super Admin (any course).  Immutable once created — corrections
    are stacked, not edited.
    """
    class CorrectedBy(models.TextChoices):
        TEACHER     = 'teacher',     'Teacher'
        SUPER_ADMIN = 'super_admin', 'Super Admin'

    # The submission being corrected (FK to mock-data concept; use string ref
    # so this model stays decoupled from a specific Assignment model)
    submission_id   = models.CharField(max_length=64, db_index=True)
    assignment_id   = models.CharField(max_length=64, db_index=True)
    student         = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='grade_corrections_received',
    )
    corrected_by    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='grade_corrections_made',
    )
    corrected_by_role = models.CharField(max_length=11, choices=CorrectedBy.choices)

    old_score       = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    new_score       = models.DecimalField(max_digits=6, decimal_places=2)
    reason          = models.TextField(help_text='Required — explain why the grade was changed.')
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'grade_corrections'
        ordering = ['-created_at']

    def __str__(self):
        return (
            f'Correction on sub={self.submission_id}: '
            f'{self.old_score} → {self.new_score} by {self.corrected_by}'
        )
