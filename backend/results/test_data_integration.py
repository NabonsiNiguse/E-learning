"""
Data integration tests for the refactored Grade / AssessmentScore system.
Tests model integrity, GradingScale logic, and GradeAppeal workflow.
"""
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal

from users.models import User
from courses.models import Faculty, Department, Course, AcademicSemester, CourseOffering
from enrollments.models import Enrollment
from .models import Grade, AssessmentTemplate, AssessmentScore, GradingScale, GradingRule, GradeAppeal, AcademicAuditLog


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_full_stack(admin, dean, dept_head, teacher, student):
    """Create the full organizational stack needed by most tests."""
    faculty = Faculty.objects.create(name='Engineering', code='ENG', dean=dean)
    department = Department.objects.create(faculty=faculty, name='CS', code='CS', head=dept_head)
    course = Course.objects.create(
        department=department,
        title='Test Course',
        slug='test-course',
        description='Test',
        status=Course.Status.PUBLISHED,
    )
    semester = AcademicSemester.objects.create(year=2024, semester='Fall', is_active=True)
    offering = CourseOffering.objects.create(
        course=course, semester=semester, instructor=teacher,
        section_code='A', max_capacity=30,
    )
    enrollment = Enrollment.objects.create(
        student=student, course_offering=offering, status=Enrollment.Status.ACTIVE
    )
    return faculty, department, course, semester, offering, enrollment


# ---------------------------------------------------------------------------
# Grade Model Tests
# ---------------------------------------------------------------------------

class GradeModelTests(TestCase):
    """Test Grade model data integrity and compute_grade logic."""

    def setUp(self):
        self.admin = User.objects.create_user(email='admin@t.com', password='pass', role='admin')
        self.dean = User.objects.create_user(email='dean@t.com', password='pass', role='dean')
        self.dept_head = User.objects.create_user(email='head@t.com', password='pass', role='dept_head')
        self.teacher = User.objects.create_user(email='teacher@t.com', password='pass', role='teacher')
        self.student = User.objects.create_user(email='student@t.com', password='pass', role='student')
        _, _, _, _, _, self.enrollment = _create_full_stack(
            self.admin, self.dean, self.dept_head, self.teacher, self.student
        )

    def test_grade_created_as_draft(self):
        """Grade default status is DRAFT."""
        grade = Grade.objects.create(enrollment=self.enrollment)
        self.assertEqual(grade.status, Grade.Status.DRAFT)

    def test_grade_is_locked_when_locked_or_released(self):
        """Grade.is_locked returns True for LOCKED and RELEASED."""
        grade = Grade.objects.create(enrollment=self.enrollment, status=Grade.Status.LOCKED)
        self.assertTrue(grade.is_locked)

        grade.status = Grade.Status.RELEASED
        grade.save()
        self.assertTrue(grade.is_locked)

    def test_grade_is_not_locked_when_draft(self):
        """Grade.is_locked returns False for DRAFT."""
        grade = Grade.objects.create(enrollment=self.enrollment, status=Grade.Status.DRAFT)
        self.assertFalse(grade.is_locked)

    def test_compute_grade_no_score(self):
        """compute_grade returns None when raw_total_score is None."""
        grade = Grade.objects.create(enrollment=self.enrollment, raw_total_score=None)
        self.assertIsNone(grade.compute_grade())

    def test_compute_grade_with_active_scale(self):
        """compute_grade returns correct letter/gpa from active GradingScale."""
        scale = GradingScale.objects.create(name='Scale', is_active=True, created_by=self.admin)
        GradingRule.objects.create(
            scale=scale, letter='A+', min_score=Decimal('95'), max_score=Decimal('100'),
            gpa_points=Decimal('4.0'), pass_fail='pass',
        )
        grade = Grade.objects.create(enrollment=self.enrollment, raw_total_score=Decimal('98'))
        result = grade.compute_grade()
        self.assertIsNotNone(result)
        self.assertEqual(result['letter'], 'A+')
        self.assertEqual(result['gpa'], 4.0)
        self.assertEqual(result['pass_fail'], 'pass')

    def test_compute_grade_no_active_scale(self):
        """compute_grade returns None when no active GradingScale exists."""
        grade = Grade.objects.create(enrollment=self.enrollment, raw_total_score=Decimal('85'))
        self.assertIsNone(grade.compute_grade())

    def test_version_default_is_1(self):
        """Grade.version defaults to 1 (Optimistic Locking)."""
        grade = Grade.objects.create(enrollment=self.enrollment)
        self.assertEqual(grade.version, 1)


# ---------------------------------------------------------------------------
# AssessmentScore Model Tests
# ---------------------------------------------------------------------------

class AssessmentScoreModelTests(TestCase):
    """Test AssessmentScore model integrity."""

    def setUp(self):
        self.admin = User.objects.create_user(email='admin@t.com', password='pass', role='admin')
        self.dean = User.objects.create_user(email='dean@t.com', password='pass', role='dean')
        self.dept_head = User.objects.create_user(email='head@t.com', password='pass', role='dept_head')
        self.teacher = User.objects.create_user(email='teacher@t.com', password='pass', role='teacher')
        self.student = User.objects.create_user(email='student@t.com', password='pass', role='student')
        _, _, _, _, self.offering, self.enrollment = _create_full_stack(
            self.admin, self.dean, self.dept_head, self.teacher, self.student
        )
        self.template = AssessmentTemplate.objects.create(
            course_offering=self.offering, name='Midterm',
            max_score=Decimal('100'), weight_percentage=Decimal('50'),
        )

    def test_assessment_score_version_default(self):
        """AssessmentScore.version defaults to 1."""
        score = AssessmentScore.objects.create(
            enrollment=self.enrollment, template=self.template, score_obtained=None
        )
        self.assertEqual(score.version, 1)

    def test_assessment_score_unique_per_enrollment_template(self):
        """Cannot create two AssessmentScores for same enrollment+template."""
        AssessmentScore.objects.create(
            enrollment=self.enrollment, template=self.template, score_obtained=Decimal('80')
        )
        with self.assertRaises(Exception):
            AssessmentScore.objects.create(
                enrollment=self.enrollment, template=self.template, score_obtained=Decimal('90')
            )


# ---------------------------------------------------------------------------
# AcademicAuditLog Tests
# ---------------------------------------------------------------------------

class AcademicAuditLogTests(TestCase):
    """Test that audit logs capture the right metadata."""

    def setUp(self):
        self.admin = User.objects.create_user(email='admin@t.com', password='pass', role='admin')
        self.dean = User.objects.create_user(email='dean@t.com', password='pass', role='dean')
        self.dept_head = User.objects.create_user(email='head@t.com', password='pass', role='dept_head')
        self.teacher = User.objects.create_user(email='teacher@t.com', password='pass', role='teacher')
        self.student = User.objects.create_user(email='student@t.com', password='pass', role='student')
        _, _, _, _, _, self.enrollment = _create_full_stack(
            self.admin, self.dean, self.dept_head, self.teacher, self.student
        )
        self.grade = Grade.objects.create(enrollment=self.enrollment)

    def test_audit_log_creation(self):
        """Audit log can be created and has correct fields."""
        log = AcademicAuditLog.objects.create(
            table_name='grades',
            record_id=self.grade.id,
            action='INSERT',
            new_value={'status': 'draft', 'version': 1},
            changed_by=self.admin,
        )
        self.assertEqual(log.action, 'INSERT')
        self.assertEqual(log.table_name, 'grades')
        self.assertIsNotNone(log.timestamp)

    def test_audit_log_tracks_old_and_new_values(self):
        """Audit log stores old_value and new_value dicts."""
        log = AcademicAuditLog.objects.create(
            table_name='grades',
            record_id=self.grade.id,
            action='UPDATE',
            old_value={'raw_total_score': None, 'version': 1},
            new_value={'raw_total_score': '88.5', 'version': 2},
            changed_by=self.teacher,
        )
        self.assertIsNone(log.old_value['raw_total_score'])
        self.assertEqual(log.new_value['raw_total_score'], '88.5')


# ---------------------------------------------------------------------------
# GradeAppeal Tests
# ---------------------------------------------------------------------------

class GradeAppealTests(TestCase):
    """Test GradeAppeal workflow: create, teacher review, admin override."""

    def setUp(self):
        self.admin = User.objects.create_user(email='admin@t.com', password='pass', role='admin')
        self.dean = User.objects.create_user(email='dean@t.com', password='pass', role='dean')
        self.dept_head = User.objects.create_user(email='head@t.com', password='pass', role='dept_head')
        self.teacher = User.objects.create_user(email='teacher@t.com', password='pass', role='teacher')
        self.student = User.objects.create_user(email='student@t.com', password='pass', role='student')
        _, _, _, _, _, self.enrollment = _create_full_stack(
            self.admin, self.dean, self.dept_head, self.teacher, self.student
        )
        self.grade = Grade.objects.create(
            enrollment=self.enrollment, raw_total_score=Decimal('75'), status=Grade.Status.RELEASED
        )

    def test_appeal_creation(self):
        """Student can create an appeal; default status is PENDING."""
        appeal = GradeAppeal.objects.create(
            grade=self.grade, student=self.student, reason='Please review my grade.'
        )
        self.assertEqual(appeal.status, GradeAppeal.Status.PENDING)

    def test_appeal_unique_per_grade_per_student(self):
        """Only one appeal per (grade, student)."""
        GradeAppeal.objects.create(grade=self.grade, student=self.student, reason='First appeal')
        with self.assertRaises(Exception):
            GradeAppeal.objects.create(grade=self.grade, student=self.student, reason='Second')

    def test_teacher_can_review_appeal(self):
        """Teacher sets teacher_response and status transitions to REVIEWED."""
        appeal = GradeAppeal.objects.create(grade=self.grade, student=self.student, reason='Review!')
        appeal.teacher_response = 'Your answer to Q3 was marked correctly.'
        appeal.teacher_reviewed_by = self.teacher
        appeal.teacher_reviewed_at = timezone.now()
        appeal.status = GradeAppeal.Status.REVIEWED
        appeal.save()
        appeal.refresh_from_db()
        self.assertEqual(appeal.status, GradeAppeal.Status.REVIEWED)
        self.assertEqual(appeal.teacher_reviewed_by, self.teacher)

    def test_admin_override_appeal(self):
        """Admin overrides score; grade.raw_total_score gets updated."""
        appeal = GradeAppeal.objects.create(grade=self.grade, student=self.student, reason='Override!')
        appeal.override_score = Decimal('90')
        appeal.override_reason = 'Regraded after appeal'
        appeal.override_by = self.admin
        appeal.override_at = timezone.now()
        appeal.status = GradeAppeal.Status.APPROVED
        appeal.save()

        self.grade.raw_total_score = Decimal('90')
        self.grade.save()

        self.grade.refresh_from_db()
        self.assertEqual(self.grade.raw_total_score, Decimal('90'))
        self.assertEqual(appeal.status, GradeAppeal.Status.APPROVED)


# ---------------------------------------------------------------------------
# GradingScale API Tests
# ---------------------------------------------------------------------------

class GradingScaleAPITests(APITestCase):
    """Admin-only CRUD for GradingScale."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(email='admin@t.com', password='pass', role='admin')
        self.teacher = User.objects.create_user(email='teacher@t.com', password='pass', role='teacher')

    def test_admin_can_create_grading_scale(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Standard Scale',
            'is_active': True,
            'rules': [
                {'letter': 'A', 'min_score': 90, 'max_score': 100, 'gpa_points': 4.0, 'pass_fail': 'pass'},
            ],
        }
        response = self.client.post('/api/v1/results/grading-scales/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_teacher_cannot_create_grading_scale(self):
        self.client.force_authenticate(user=self.teacher)
        data = {'name': 'Bad Scale', 'is_active': False, 'rules': []}
        response = self.client.post('/api/v1/results/grading-scales/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
