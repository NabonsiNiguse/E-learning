"""
Initial migration for the results app.
Creates: GradingScale, GradingRule, StudentResult, ResultAuditLog, GradeAppeal
"""
from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('courses', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ── GradingScale ──────────────────────────────────────────────────
        migrations.CreateModel(
            name='GradingScale',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text="e.g. 'Standard 2024'", max_length=100)),
                ('is_active', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='grading_scales_created',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'grading_scales', 'ordering': ['-created_at']},
        ),

        # ── GradingRule ───────────────────────────────────────────────────
        migrations.CreateModel(
            name='GradingRule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('letter', models.CharField(max_length=3)),
                ('min_score', models.DecimalField(decimal_places=2, max_digits=5)),
                ('max_score', models.DecimalField(decimal_places=2, max_digits=5)),
                ('gpa_points', models.DecimalField(decimal_places=1, max_digits=3)),
                ('pass_fail', models.CharField(
                    choices=[('pass', 'Pass'), ('fail', 'Fail')],
                    default='pass',
                    max_length=4,
                )),
                ('scale', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='rules',
                    to='results.gradingscale',
                )),
            ],
            options={
                'db_table': 'grading_rules',
                'ordering': ['-min_score'],
                'unique_together': {('scale', 'letter')},
            },
        ),

        # ── StudentResult ─────────────────────────────────────────────────
        migrations.CreateModel(
            name='StudentResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.PositiveSmallIntegerField(db_index=True, help_text='Academic year, e.g. 2024')),
                ('semester', models.CharField(
                    choices=[
                        ('semester_1', 'Semester 1'),
                        ('semester_2', 'Semester 2'),
                        ('summer', 'Summer'),
                    ],
                    db_index=True,
                    max_length=12,
                )),
                ('raw_score', models.DecimalField(
                    blank=True,
                    decimal_places=2,
                    help_text='Score entered by teacher (0–100). Grade is computed automatically.',
                    max_digits=5,
                    null=True,
                    validators=[
                        django.core.validators.MinValueValidator(0),
                        django.core.validators.MaxValueValidator(100),
                    ],
                )),
                ('status', models.CharField(
                    choices=[
                        ('draft', 'Draft'),
                        ('submitted', 'Submitted'),
                        ('approved', 'Approved'),
                        ('unlocked', 'Unlocked'),
                    ],
                    default='draft',
                    max_length=10,
                )),
                ('submitted_at', models.DateTimeField(blank=True, null=True)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('unlocked_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('student', models.ForeignKey(
                    limit_choices_to={'role': 'student'},
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='results',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('course', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='results',
                    to='courses.course',
                )),
                ('submitted_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='results_submitted',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('approved_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='results_approved',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('unlocked_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='results_unlocked',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'student_results',
                'ordering': ['-year', 'semester', 'student__last_name'],
                'unique_together': {('student', 'course', 'year', 'semester')},
            },
        ),

        # ── ResultAuditLog ────────────────────────────────────────────────
        migrations.CreateModel(
            name='ResultAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(
                    choices=[
                        ('created', 'Created'),
                        ('score_set', 'Score Set'),
                        ('submitted', 'Submitted'),
                        ('approved', 'Approved'),
                        ('unlocked', 'Unlocked'),
                        ('deleted', 'Deleted'),
                    ],
                    max_length=10,
                )),
                ('performed_by_role', models.CharField(max_length=11)),
                ('old_value', models.JSONField(blank=True, help_text='State before change', null=True)),
                ('new_value', models.JSONField(blank=True, help_text='State after change', null=True)),
                ('note', models.TextField(blank=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('result', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='audit_logs',
                    to='results.studentresult',
                )),
                ('performed_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='result_audit_logs',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'result_audit_logs', 'ordering': ['-timestamp']},
        ),

        # ── GradeAppeal ───────────────────────────────────────────────────
        migrations.CreateModel(
            name='GradeAppeal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.TextField()),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('reviewed', 'Reviewed by Teacher'),
                        ('escalated', 'Escalated to Admin'),
                        ('approved', 'Approved'),
                        ('rejected', 'Rejected'),
                    ],
                    default='pending',
                    max_length=10,
                )),
                ('teacher_response', models.TextField(blank=True)),
                ('teacher_reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('override_score', models.DecimalField(
                    blank=True,
                    decimal_places=2,
                    max_digits=5,
                    null=True,
                    validators=[
                        django.core.validators.MinValueValidator(0),
                        django.core.validators.MaxValueValidator(100),
                    ],
                )),
                ('override_reason', models.TextField(blank=True)),
                ('override_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('result', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='appeals',
                    to='results.studentresult',
                )),
                ('student', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='grade_appeals',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('teacher_reviewed_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='appeals_reviewed',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('override_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='appeals_overridden',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'grade_appeals',
                'ordering': ['-created_at'],
                'unique_together': {('result', 'student')},
            },
        ),
    ]
