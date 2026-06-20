"""
Integration tests for the Results system.
Tests role-based access, data integrity, and workflow.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from courses.models import Course
from results.models import (
    StudentResult, GradingScale, GradingRule, ResultAuditLog, GradeAppeal
)

User = get_user_model()


class ResultsIntegrationTestCase(TestCase):
    """Integration tests for results system."""

    def setUp(self):
        """Set up test data."""
        # Create users
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com',
            password='testpass123',
            first_name='Teacher',
            last_name='User',
            role=User.Role.TEACHER,
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role=User.Role.STUDENT,
        )
        self.other_student = User.objects.create_user(
            email='other@test.com',
            password='testpass123',
            first_name='Other',
            last_name='Student',
            role=User.Role.STUDENT,
        )

        # Create course
        self.course = Course.objects.create(
            title='Test Course',
            description='Test',
            teacher=self.teacher,
            category='Test',
            level='Beginner',
        )

        # Create grading scale
        self.scale = GradingScale.objects.create(
            name='Test Scale',
            is_active=True,
            created_by=self.admin,
        )
        GradingRule.objects.create(
            scale=self.scale,
            letter='A+',
            min_score=95,
            max_score=100,
            gpa_points=4.0,
            pass_fail='pass',
        )
        GradingRule.objects.create(
            scale=self.scale,
            letter='F',
            min_score=0,
            max_score=59.99,
            gpa_points=0.0,
            pass_fail='fail',
        )

        # Create result
        self.result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            status=StudentResult.Status.DRAFT,
        )

        self.client = APIClient()

    def test_teacher_can_view_own_students(self):
        """Teacher can view results for their students."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_teacher_cannot_view_other_teachers_students(self):
        """Teacher cannot view results for other teachers' students."""
        other_teacher = User.objects.create_user(
            email='other_teacher@test.com',
            password='testpass123',
            first_name='Other',
            last_name='Teacher',
            role=User.Role.TEACHER,
        )
        self.client.force_authenticate(user=other_teacher)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_student_can_view_own_results(self):
        """Student can view only their own results."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.result.id)

    def test_student_cannot_view_other_students_results(self):
        """Student cannot view other students' results."""
        self.client.force_authenticate(user=self.other_student)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_admin_can_view_all_results(self):
        """Admin can view all results."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_teacher_can_update_raw_score(self):
        """Teacher can update raw_score."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'raw_score': 85.5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.result.refresh_from_db()
        self.assertEqual(float(self.result.raw_score), 85.5)

    def test_teacher_cannot_update_grade(self):
        """Teacher cannot update grade directly."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'status': 'submitted'},
            format='json',
        )
        # Should fail or ignore the status field
        self.result.refresh_from_db()
        self.assertEqual(self.result.status, StudentResult.Status.DRAFT)

    def test_score_validation_0_to_100(self):
        """Score must be between 0 and 100."""
        self.client.force_authenticate(user=self.teacher)
        
        # Test > 100
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'raw_score': 150},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test < 0
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'raw_score': -10},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_grade_computed_from_scale(self):
        """Grade is computed from GradingScale."""
        self.result.raw_score = 98
        self.result.save()
        
        computed = self.result.compute_grade()
        self.assertIsNotNone(computed)
        self.assertEqual(computed['letter'], 'A+')
        self.assertEqual(computed['gpa'], 4.0)
        self.assertEqual(computed['pass_fail'], 'pass')

    def test_teacher_can_submit_result(self):
        """Teacher can submit result to lock it."""
        self.result.raw_score = 85
        self.result.save()
        
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            f'/api/v1/results/{self.result.id}/submit/',
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.result.refresh_from_db()
        self.assertEqual(self.result.status, StudentResult.Status.SUBMITTED)
        self.assertIsNotNone(self.result.submitted_at)
        self.assertEqual(self.result.submitted_by, self.teacher)

    def test_cannot_submit_without_score(self):
        """Cannot submit result without score."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            f'/api/v1/results/{self.result.id}/submit/',
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_edit_locked_result(self):
        """Teacher cannot edit locked result."""
        self.result.raw_score = 85
        self.result.status = StudentResult.Status.SUBMITTED
        self.result.save()
        
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'raw_score': 90},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_can_resubmit_unlocked_result(self):
        """Teacher can submit an unlocked result again."""
        self.result.raw_score = 85
        self.result.status = StudentResult.Status.UNLOCKED
        self.result.unlocked_at = None
        self.result.unlocked_by = None
        self.result.save()

        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            f'/api/v1/results/{self.result.id}/submit/',
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.result.refresh_from_db()
        self.assertEqual(self.result.status, StudentResult.Status.SUBMITTED)
        self.assertIsNotNone(self.result.submitted_at)
        self.assertEqual(self.result.submitted_by, self.teacher)

    def test_admin_can_approve_result(self):
        """Admin can approve submitted result."""
        self.result.raw_score = 85
        self.result.status = StudentResult.Status.SUBMITTED
        self.result.save()
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/results/{self.result.id}/approve/',
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.result.refresh_from_db()
        self.assertEqual(self.result.status, StudentResult.Status.APPROVED)
        self.assertIsNotNone(self.result.approved_at)
        self.assertEqual(self.result.approved_by, self.admin)

    def test_admin_can_unlock_result(self):
        """Admin can unlock result."""
        self.result.raw_score = 85
        self.result.status = StudentResult.Status.SUBMITTED
        self.result.save()
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/results/{self.result.id}/unlock/',
            {},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.result.refresh_from_db()
        self.assertEqual(self.result.status, StudentResult.Status.UNLOCKED)
        self.assertIsNotNone(self.result.unlocked_at)
        self.assertEqual(self.result.unlocked_by, self.admin)

    def test_audit_log_created_on_score_update(self):
        """Audit log created when score updated."""
        self.client.force_authenticate(user=self.teacher)
        self.client.patch(
            f'/api/v1/results/{self.result.id}/',
            {'raw_score': 85.5},
            format='json',
        )
        
        logs = ResultAuditLog.objects.filter(result=self.result)
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.action, ResultAuditLog.Action.SCORE_SET)
        self.assertEqual(log.performed_by, self.teacher)
        self.assertEqual(log.performed_by_role, 'teacher')

    def test_audit_log_created_on_submit(self):
        """Audit log created when result submitted."""
        self.result.raw_score = 85
        self.result.save()
        
        self.client.force_authenticate(user=self.teacher)
        self.client.post(
            f'/api/v1/results/{self.result.id}/submit/',
            {},
            format='json',
        )
        
        logs = ResultAuditLog.objects.filter(result=self.result)
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.action, ResultAuditLog.Action.SUBMITTED)

    def test_unique_constraint_prevents_duplicates(self):
        """Unique constraint prevents duplicate results."""
        with self.assertRaises(Exception):
            StudentResult.objects.create(
                student=self.student,
                course=self.course,
                year=2024,
                semester='semester_1',
            )

    def test_only_one_active_grading_scale(self):
        """Only one active grading scale at a time."""
        new_scale = GradingScale.objects.create(
            name='New Scale',
            is_active=True,
            created_by=self.admin,
        )
        
        self.scale.refresh_from_db()
        self.assertFalse(self.scale.is_active)
        self.assertTrue(new_scale.is_active)

    def test_student_can_create_appeal(self):
        """Student can create grade appeal."""
        self.result.raw_score = 50
        self.result.status = StudentResult.Status.APPROVED
        self.result.save()
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            '/api/v1/results/appeals/',
            {
                'result': self.result.id,
                'reason': 'I believe my score should be higher',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        appeal = GradeAppeal.objects.get(result=self.result)
        self.assertEqual(appeal.student, self.student)
        self.assertEqual(appeal.status, GradeAppeal.Status.PENDING)

    def test_teacher_can_review_appeal(self):
        """Teacher can review appeal."""
        appeal = GradeAppeal.objects.create(
            result=self.result,
            student=self.student,
            reason='Test appeal',
        )
        
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            f'/api/v1/results/appeals/{appeal.id}/review/',
            {'teacher_response': 'Thank you for your appeal...'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        appeal.refresh_from_db()
        self.assertEqual(appeal.status, GradeAppeal.Status.REVIEWED)
        self.assertEqual(appeal.teacher_reviewed_by, self.teacher)

    def test_admin_can_override_grade(self):
        """Admin can override grade via appeal."""
        appeal = GradeAppeal.objects.create(
            result=self.result,
            student=self.student,
            reason='Test appeal',
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/results/appeals/{appeal.id}/override/',
            {
                'override_score': 90,
                'override_reason': 'Appeal approved',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.result.refresh_from_db()
        self.assertEqual(float(self.result.raw_score), 90)
        
        appeal.refresh_from_db()
        self.assertEqual(appeal.status, GradeAppeal.Status.APPROVED)
        self.assertEqual(appeal.override_by, self.admin)
