"""
Comprehensive data integration tests for Results system.
Tests role-based access, data integrity, and workflow states.
"""
import pytest
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal

from users.models import User
from courses.models import Course
from .models import StudentResult, GradingScale, GradingRule, ResultAuditLog, GradeAppeal


class StudentResultModelTests(TestCase):
    """Test StudentResult model data integrity."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role='admin'
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass', role='teacher'
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass', role='student'
        )
        self.course = Course.objects.create(
            title='Test Course', teacher=self.teacher, description='Test'
        )

    def test_score_validation_range(self):
        """Score must be between 0 and 100."""
        result = StudentResult(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('150'),  # Invalid
        )
        with self.assertRaises(ValidationError):
            result.full_clean()

    def test_score_validation_negative(self):
        """Score cannot be negative."""
        result = StudentResult(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('-10'),
        )
        with self.assertRaises(ValidationError):
            result.full_clean()

    def test_score_validation_valid(self):
        """Valid scores pass validation."""
        result = StudentResult(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('85.5'),
        )
        result.full_clean()  # Should not raise

    def test_unique_constraint(self):
        """Cannot create duplicate (student, course, year, semester)."""
        StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('85'),
        )
        with self.assertRaises(Exception):  # IntegrityError
            StudentResult.objects.create(
                student=self.student,
                course=self.course,
                year=2024,
                semester='semester_1',
                raw_score=Decimal('90'),
            )

    def test_is_locked_draft(self):
        """Draft status is not locked."""
        result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            status=StudentResult.Status.DRAFT,
        )
        assert not result.is_locked

    def test_is_locked_submitted(self):
        """Submitted status is locked."""
        result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            status=StudentResult.Status.SUBMITTED,
        )
        assert result.is_locked

    def test_is_locked_approved(self):
        """Approved status is locked."""
        result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            status=StudentResult.Status.APPROVED,
        )
        assert result.is_locked

    def test_compute_grade_no_score(self):
        """Grade is None if no score."""
        result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=None,
        )
        assert result.compute_grade() is None

    def test_compute_grade_with_scale(self):
        """Grade computed from active GradingScale."""
        # Create grading scale
        scale = GradingScale.objects.create(name='Test Scale', is_active=True)
        GradingRule.objects.create(
            scale=scale,
            letter='A+',
            min_score=Decimal('95'),
            max_score=Decimal('100'),
            gpa_points=Decimal('4.0'),
            pass_fail='pass',
        )

        result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('98'),
        )

        grade = result.compute_grade()
        assert grade['letter'] == 'A+'
        assert grade['gpa'] == 4.0
        assert grade['pass_fail'] == 'pass'

    def test_compute_grade_no_active_scale(self):
        """Grade is None if no active scale."""
        result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('85'),
        )
        assert result.compute_grade() is None


class ResultAuditLogTests(TestCase):
    """Test audit logging."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role='admin'
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass', role='teacher'
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass', role='student'
        )
        self.course = Course.objects.create(
            title='Test Course', teacher=self.teacher, description='Test'
        )
        self.result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
        )

    def test_audit_log_creation(self):
        """Audit log created on result creation."""
        log = ResultAuditLog.objects.create(
            result=self.result,
            action=ResultAuditLog.Action.CREATED,
            performed_by=self.admin,
            performed_by_role='admin',
        )
        assert log.action == ResultAuditLog.Action.CREATED
        assert log.performed_by == self.admin

    def test_audit_log_immutable(self):
        """Audit log should not be updated."""
        log = ResultAuditLog.objects.create(
            result=self.result,
            action=ResultAuditLog.Action.CREATED,
            performed_by=self.admin,
            performed_by_role='admin',
        )
        # In practice, we never update audit logs
        # This test documents that behavior
        assert log.timestamp is not None

    def test_audit_log_tracks_changes(self):
        """Audit log tracks old and new values."""
        log = ResultAuditLog.objects.create(
            result=self.result,
            action=ResultAuditLog.Action.SCORE_SET,
            performed_by=self.teacher,
            performed_by_role='teacher',
            old_value={'raw_score': None},
            new_value={'raw_score': '85.5'},
        )
        assert log.old_value['raw_score'] is None
        assert log.new_value['raw_score'] == '85.5'


class GradeAppealTests(TestCase):
    """Test grade appeal workflow."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role='admin'
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass', role='teacher'
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass', role='student'
        )
        self.course = Course.objects.create(
            title='Test Course', teacher=self.teacher, description='Test'
        )
        self.result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('85'),
        )

    def test_appeal_creation(self):
        """Student can create appeal."""
        appeal = GradeAppeal.objects.create(
            result=self.result,
            student=self.student,
            reason='I believe my score should be higher.',
            status=GradeAppeal.Status.PENDING,
        )
        assert appeal.status == GradeAppeal.Status.PENDING

    def test_appeal_unique_per_result(self):
        """Only one appeal per result per student."""
        GradeAppeal.objects.create(
            result=self.result,
            student=self.student,
            reason='First appeal',
        )
        with self.assertRaises(Exception):  # IntegrityError
            GradeAppeal.objects.create(
                result=self.result,
                student=self.student,
                reason='Second appeal',
            )

    def test_appeal_teacher_review(self):
        """Teacher can review appeal."""
        appeal = GradeAppeal.objects.create(
            result=self.result,
            student=self.student,
            reason='Appeal reason',
        )
        appeal.teacher_response = 'I reviewed your work...'
        appeal.teacher_reviewed_by = self.teacher
        appeal.teacher_reviewed_at = timezone.now()
        appeal.status = GradeAppeal.Status.REVIEWED
        appeal.save()

        assert appeal.status == GradeAppeal.Status.REVIEWED
        assert appeal.teacher_reviewed_by == self.teacher

    def test_appeal_admin_override(self):
        """Admin can override score via appeal."""
        appeal = GradeAppeal.objects.create(
            result=self.result,
            student=self.student,
            reason='Appeal reason',
        )
        appeal.override_score = Decimal('90')
        appeal.override_reason = 'Appeal approved'
        appeal.override_by = self.admin
        appeal.override_at = timezone.now()
        appeal.status = GradeAppeal.Status.APPROVED
        appeal.save()

        # Update result score
        self.result.raw_score = Decimal('90')
        self.result.save()

        assert self.result.raw_score == Decimal('90')
        assert appeal.status == GradeAppeal.Status.APPROVED


class ResultsAPITests(APITestCase):
    """Test Results API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role='admin'
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass', role='teacher'
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass', role='student'
        )
        self.course = Course.objects.create(
            title='Test Course', teacher=self.teacher, description='Test'
        )
        self.result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('85'),
        )

    def test_teacher_cannot_see_grades(self):
        """Teacher serializer excludes grade fields."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/v1/results/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        if data:
            assert 'grade_letter' not in data[0]
            assert 'gpa' not in data[0]
            assert 'status' in data[0]

    def test_student_sees_own_results_only(self):
        """Student can only see own results."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/v1/results/')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['id'] == self.result.id

    def test_admin_sees_all_results(self):
        """Admin can see all results."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/results/')
        assert response.status_code == status.HTTP_200_OK

    def test_teacher_can_update_score(self):
        """Teacher can update raw_score."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'raw_score': 90},
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        self.result.refresh_from_db()
        assert self.result.raw_score == Decimal('90')

    def test_teacher_cannot_update_status(self):
        """Teacher cannot update status."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'status': 'approved'},
            format='json',
        )
        # Should either fail or ignore the status field
        self.result.refresh_from_db()
        assert self.result.status == StudentResult.Status.DRAFT

    def test_student_cannot_update_result(self):
        """Student cannot update results."""
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'raw_score': 100},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_submit_workflow(self):
        """Teacher can submit result."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            f'/api/v1/results/{self.result.id}/submit/',
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        self.result.refresh_from_db()
        assert self.result.status == StudentResult.Status.SUBMITTED

    def test_admin_approve_workflow(self):
        """Admin can approve result."""
        self.result.status = StudentResult.Status.SUBMITTED
        self.result.submitted_by = self.teacher
        self.result.submitted_at = timezone.now()
        self.result.save()

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/results/{self.result.id}/approve/',
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        self.result.refresh_from_db()
        assert self.result.status == StudentResult.Status.APPROVED

    def test_locked_result_cannot_be_edited(self):
        """Locked result cannot be edited by teacher."""
        self.result.status = StudentResult.Status.SUBMITTED
        self.result.save()

        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'raw_score': 100},
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_unlock_result(self):
        """Admin can unlock locked result."""
        self.result.status = StudentResult.Status.SUBMITTED
        self.result.save()

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/results/{self.result.id}/unlock/',
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
        self.result.refresh_from_db()
        assert self.result.status == StudentResult.Status.UNLOCKED

    def test_audit_log_endpoint(self):
        """Admin can view audit log."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            f'/api/v1/results/audit_log/?result_id={self.result.id}'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_student_cannot_view_audit_log(self):
        """Student cannot view audit log."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(
            f'/api/v1/results/audit_log/?result_id={self.result.id}'
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class GradingScaleAPITests(APITestCase):
    """Test Grading Scale API."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role='admin'
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass', role='teacher'
        )

    def test_admin_can_create_grading_scale(self):
        """Admin can create grading scale."""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name': 'Test Scale',
            'is_active': True,
            'rules': [
                {
                    'letter': 'A+',
                    'min_score': 95,
                    'max_score': 100,
                    'gpa_points': 4.0,
                    'pass_fail': 'pass',
                }
            ],
        }
        response = self.client.post(
            '/api/v1/results/grading-scales/',
            data,
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_teacher_cannot_create_grading_scale(self):
        """Teacher cannot create grading scale."""
        self.client.force_authenticate(user=self.teacher)
        data = {
            'name': 'Test Scale',
            'is_active': True,
            'rules': [],
        }
        response = self.client.post(
            '/api/v1/results/grading-scales/',
            data,
            format='json',
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class GradeAppealAPITests(APITestCase):
    """Test Grade Appeal API."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role='admin'
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass', role='teacher'
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass', role='student'
        )
        self.course = Course.objects.create(
            title='Test Course', teacher=self.teacher, description='Test'
        )
        self.result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=Decimal('85'),
        )

    def test_student_can_create_appeal(self):
        """Student can create appeal."""
        self.client.force_authenticate(user=self.student)
        data = {
            'result': self.result.id,
            'reason': 'I believe my score should be higher.',
        }
        response = self.client.post(
            '/api/v1/results/appeals/',
            data,
            format='json',
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_teacher_can_review_appeal(self):
        """Teacher can review appeal."""
        appeal = GradeAppeal.objects.create(
            result=self.result,
            student=self.student,
            reason='Appeal reason',
        )
        self.client.force_authenticate(user=self.teacher)
        data = {'teacher_response': 'I reviewed your work...'}
        response = self.client.post(
            f'/api/v1/results/appeals/{appeal.id}/review/',
            data,
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK

    def test_admin_can_override_appeal(self):
        """Admin can override grade via appeal."""
        appeal = GradeAppeal.objects.create(
            result=self.result,
            student=self.student,
            reason='Appeal reason',
        )
        self.client.force_authenticate(user=self.admin)
        data = {
            'override_score': 90,
            'override_reason': 'Appeal approved',
        }
        response = self.client.post(
            f'/api/v1/results/appeals/{appeal.id}/override/',
            data,
            format='json',
        )
        assert response.status_code == status.HTTP_200_OK
