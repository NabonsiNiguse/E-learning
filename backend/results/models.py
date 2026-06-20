"""
Results models — role-based grade management with full data integrity.

Design principles:
  - Raw scores (0–100) stored separately from computed grades/GPA
  - Grades calculated automatically via GradingScale — teachers cannot set them
  - All mutations produce an immutable AuditLog entry
  - Records lock after final submission; only Admin can unlock
  - Year/semester filtering via indexed fields — never mutates original data
  - unique_together on (student, course, year, semester) prevents duplicates
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


# ---------------------------------------------------------------------------
# Grading Scale — managed by Admin only
# ---------------------------------------------------------------------------
class GradingScale(models.Model):
    """
    Defines the official letter-grade thresholds.
    Admin creates/updates these; teachers and students cannot touch them.
    Only one active scale at a time (is_active=True).
    """
    name        = models.CharField(max_length=100, help_text="e.g. 'Standard 2024'")
    is_active   = models.BooleanField(default=False)
    created_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='grading_scales_created',
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'grading_scales'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({"active" if self.is_active else "inactive"})'

    def save(self, *args, **kwargs):
        # Enforce single active scale
        if self.is_active:
            GradingScale.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class GradingRule(models.Model):
    """
    One row per letter grade in a GradingScale.
    e.g. A+ → min_score=95, max_score=100, gpa_points=4.0
    """
    scale       = models.ForeignKey(GradingScale, on_delete=models.CASCADE, related_name='rules')
    letter      = models.CharField(max_length=3)   # A+, A, B+, B, C+, C, D, F
    min_score   = models.DecimalField(max_digits=5, decimal_places=2)
    max_score   = models.DecimalField(max_digits=5, decimal_places=2)
    gpa_points  = models.DecimalField(max_digits=3, decimal_places=1)
    pass_fail   = models.CharField(
        max_length=4,
        choices=[('pass', 'Pass'), ('fail', 'Fail')],
        default='pass',
    )

    class Meta:
        db_table = 'grading_rules'
        ordering = ['-min_score']
        unique_together = [('scale', 'letter')]

    def __str__(self):
        return f'{self.scale.name}: {self.letter} ({self.min_score}–{self.max_score})'


# ---------------------------------------------------------------------------
# Student Result — one record per student per course per semester
# ---------------------------------------------------------------------------
class StudentResult(models.Model):
    """
    Core result record. Stores raw scores only.
    Computed fields (grade_letter, gpa, pass_fail) are derived on read
    via the active GradingScale — never stored directly by teachers.
    """
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'        # teacher is entering scores
        SUBMITTED = 'submitted', 'Submitted'    # teacher submitted; locked
        APPROVED  = 'approved',  'Approved'     # admin approved final results
        UNLOCKED  = 'unlocked',  'Unlocked'     # admin unlocked for correction

    SEMESTER_CHOICES = [
        ('semester_1', 'Semester 1'),
        ('semester_2', 'Semester 2'),
        ('summer',     'Summer'),
    ]

    student     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='results', limit_choices_to={'role': 'student'},
    )
    course      = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE, related_name='results',
    )
    year        = models.PositiveSmallIntegerField(
        help_text='Academic year, e.g. 2024',
        db_index=True,
    )
    semester    = models.CharField(
        max_length=12, choices=SEMESTER_CHOICES, db_index=True,
    )

    # Raw score — only field teachers can write (0–100)
    raw_score   = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Score entered by teacher (0–100). Grade is computed automatically.',
    )

    # Workflow
    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    submitted_at  = models.DateTimeField(null=True, blank=True)
    submitted_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='results_submitted',
    )
    approved_at   = models.DateTimeField(null=True, blank=True)
    approved_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='results_approved',
    )
    unlocked_at   = models.DateTimeField(null=True, blank=True)
    unlocked_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='results_unlocked',
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_results'
        ordering = ['-year', 'semester', 'student__last_name']
        # Prevent duplicate results for same student/course/period
        unique_together = [('student', 'course', 'year', 'semester')]

    def __str__(self):
        return (
            f'{self.student.full_name} | {self.course.title} | '
            f'{self.year} {self.semester} | score={self.raw_score}'
        )

    @property
    def is_locked(self):
        return self.status in (self.Status.SUBMITTED, self.Status.APPROVED)

    def compute_grade(self):
        """
        Returns dict with letter, gpa_points, pass_fail based on active GradingScale.
        Returns None if no active scale or score is null.
        """
        if self.raw_score is None:
            return None
        try:
            scale = GradingScale.objects.get(is_active=True)
            rule  = scale.rules.filter(
                min_score__lte=self.raw_score,
                max_score__gte=self.raw_score,
            ).first()
            if rule:
                return {
                    'letter':    rule.letter,
                    'gpa':       float(rule.gpa_points),
                    'pass_fail': rule.pass_fail,
                }
        except GradingScale.DoesNotExist:
            pass
        return None


# ---------------------------------------------------------------------------
# Audit Log — immutable record of every state change
# ---------------------------------------------------------------------------
class ResultAuditLog(models.Model):
    """
    Append-only log. Never updated or deleted.
    Records who did what to which result and when.
    """
    class Action(models.TextChoices):
        CREATED   = 'created',   'Created'
        SCORE_SET = 'score_set', 'Score Set'
        SUBMITTED = 'submitted', 'Submitted'
        APPROVED  = 'approved',  'Approved'
        UNLOCKED  = 'unlocked',  'Unlocked'
        DELETED   = 'deleted',   'Deleted'

    result      = models.ForeignKey(
        StudentResult, on_delete=models.CASCADE, related_name='audit_logs',
    )
    action      = models.CharField(max_length=10, choices=Action.choices)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='result_audit_logs',
    )
    performed_by_role = models.CharField(max_length=11)
    old_value   = models.JSONField(null=True, blank=True, help_text='State before change')
    new_value   = models.JSONField(null=True, blank=True, help_text='State after change')
    note        = models.TextField(blank=True)
    timestamp   = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'result_audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f'[{self.timestamp:%Y-%m-%d %H:%M}] {self.action} on result#{self.result_id} by {self.performed_by}'


# ---------------------------------------------------------------------------
# Grade Appeals (kept from original design)
# ---------------------------------------------------------------------------
class GradeAppeal(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        REVIEWED  = 'reviewed',  'Reviewed by Teacher'
        ESCALATED = 'escalated', 'Escalated to Admin'
        APPROVED  = 'approved',  'Approved'
        REJECTED  = 'rejected',  'Rejected'

    result      = models.ForeignKey(
        StudentResult, on_delete=models.CASCADE, related_name='appeals',
    )
    student     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='grade_appeals',
    )
    reason      = models.TextField()
    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    teacher_response    = models.TextField(blank=True)
    teacher_reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='appeals_reviewed',
    )
    teacher_reviewed_at = models.DateTimeField(null=True, blank=True)

    override_score  = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    override_reason = models.TextField(blank=True)
    override_by     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='appeals_overridden',
    )
    override_at     = models.DateTimeField(null=True, blank=True)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'grade_appeals'
        ordering = ['-created_at']
        unique_together = [('result', 'student')]

    def __str__(self):
        return f'Appeal({self.student}, result#{self.result_id}, {self.status})'
