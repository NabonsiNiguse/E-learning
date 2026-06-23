from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from courses.models import CourseOffering
from enrollments.models import Enrollment


class GradingScale(models.Model):
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
        if self.is_active:
            GradingScale.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class GradingRule(models.Model):
    scale       = models.ForeignKey(GradingScale, on_delete=models.CASCADE, related_name='rules')
    letter      = models.CharField(max_length=3)
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


class AssessmentTemplate(models.Model):
    course_offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, related_name='assessments')
    name = models.CharField(max_length=100)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    weight_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(100)])

    class Meta:
        db_table = 'assessment_templates'
        unique_together = ('course_offering', 'name')

    def __str__(self):
        return f"{self.name} ({self.weight_percentage}%) for {self.course_offering}"


class AssessmentScore(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='assessment_scores')
    template = models.ForeignKey(AssessmentTemplate, on_delete=models.RESTRICT, related_name='scores')
    score_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    graded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='graded_scores')
    graded_at = models.DateTimeField(null=True, blank=True)
    version = models.PositiveIntegerField(default=1)  # Optimistic Locking

    class Meta:
        db_table = 'assessment_scores'
        unique_together = ('enrollment', 'template')

    def __str__(self):
        return f"{self.enrollment.student.email} - {self.template.name}: {self.score_obtained}"


class Grade(models.Model):
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        LOCKED    = 'locked',    'Locked'
        RELEASED  = 'released',  'Released'

    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='grade')
    raw_total_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    grade_letter = models.CharField(max_length=5, null=True, blank=True)
    gpa_points = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    version = models.PositiveIntegerField(default=1)  # Optimistic Locking
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'grades'

    def __str__(self):
        return f"{self.enrollment.student.email} - Raw Total: {self.raw_total_score} [{self.status}]"

    @property
    def is_locked(self):
        return self.status in (self.Status.LOCKED, self.Status.RELEASED)

    def compute_grade(self):
        if self.raw_total_score is None:
            return None
        try:
            scale = GradingScale.objects.get(is_active=True)
            rule = scale.rules.filter(
                min_score__lte=self.raw_total_score,
                max_score__gte=self.raw_total_score,
            ).first()
            if rule:
                return {
                    'letter': rule.letter,
                    'gpa': float(rule.gpa_points),
                    'pass_fail': rule.pass_fail,
                }
        except GradingScale.DoesNotExist:
            pass
        return None

    def save(self, *args, **kwargs):
        grade_details = self.compute_grade()
        if grade_details:
            self.grade_letter = grade_details['letter']
            self.gpa_points = grade_details['gpa']
        super().save(*args, **kwargs)


class AcademicAuditLog(models.Model):
    table_name = models.CharField(max_length=100)
    record_id = models.IntegerField()
    action = models.CharField(max_length=50)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='academic_audit_logs')
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'academic_audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.action} on {self.table_name}#{self.record_id} by {self.changed_by.email}"


class GradeAppeal(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        REVIEWED  = 'reviewed',  'Reviewed by Teacher'
        ESCALATED = 'escalated', 'Escalated to Admin'
        APPROVED  = 'approved',  'Approved'
        REJECTED  = 'rejected',  'Rejected'

    grade = models.ForeignKey(
        Grade, on_delete=models.CASCADE, related_name='appeals',
        null=True
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
        unique_together = [('grade', 'student')]

    def __str__(self):
        return f'Appeal({self.student}, grade#{self.grade_id}, {self.status})'
