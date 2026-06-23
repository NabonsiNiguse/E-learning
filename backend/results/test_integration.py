from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from django.db import transaction
from courses.models import Faculty, Department, Course, AcademicSemester, CourseOffering
from enrollments.models import Enrollment
from results.models import (
    GradingScale, GradingRule, AssessmentTemplate, AssessmentScore, Grade, GradeAppeal, AcademicAuditLog
)

User = get_user_model()


class ResultsIntegrationTestCase(TestCase):
    """Integration tests for the refactored results and grading system."""

    def setUp(self):
        # Create users with new roles
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
        )
        self.dean = User.objects.create_user(
            email='dean@test.com',
            password='testpass123',
            first_name='Dean',
            last_name='User',
            role=User.Role.DEAN,
        )
        self.dept_head = User.objects.create_user(
            email='head@test.com',
            password='testpass123',
            first_name='Head',
            last_name='User',
            role=User.Role.DEPT_HEAD,
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

        # Create organizational structure
        self.faculty = Faculty.objects.create(
            name='Engineering',
            code='ENG',
            dean=self.dean
        )
        self.department = Department.objects.create(
            faculty=self.faculty,
            name='Computer Science',
            code='CS',
            head=self.dept_head
        )
        self.course = Course.objects.create(
            department=self.department,
            title='Software Engineering',
            slug='se-301',
            description='Test course detail',
            status=Course.Status.PUBLISHED
        )
        self.semester = AcademicSemester.objects.create(
            year=2026,
            semester='Fall',
            is_active=True
        )
        self.offering = CourseOffering.objects.create(
            course=self.course,
            semester=self.semester,
            instructor=self.teacher,
            section_code='A',
            max_capacity=30
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student,
            course_offering=self.offering,
            status=Enrollment.Status.ACTIVE
        )

        # Create grading scale
        self.scale = GradingScale.objects.create(
            name='Standard Scale',
            is_active=True,
            created_by=self.admin
        )
        GradingRule.objects.create(
            scale=self.scale,
            letter='A',
            min_score=90.0,
            max_score=100.0,
            gpa_points=4.0,
            pass_fail='pass'
        )
        GradingRule.objects.create(
            scale=self.scale,
            letter='F',
            min_score=0.0,
            max_score=59.99,
            gpa_points=0.0,
            pass_fail='fail'
        )

        # Create assessment template (Midterm worth 100% of final grade)
        self.template = AssessmentTemplate.objects.create(
            course_offering=self.offering,
            name='Midterm',
            max_score=100.0,
            weight_percentage=100.0
        )

        self.assessment_score = AssessmentScore.objects.create(
            enrollment=self.enrollment,
            template=self.template,
            score_obtained=None,
            version=1
        )

        # Create Grade draft
        self.grade = Grade.objects.create(
            enrollment=self.enrollment,
            raw_total_score=None,
            status=Grade.Status.DRAFT,
            version=1
        )

        self.client = APIClient()

    def test_teacher_can_enter_assessment_score(self):
        """Teacher can input and save a draft assessment score."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(
            f'/api/v1/results/assessment-scores/{self.assessment_score.id}/',
            {'score_obtained': 95.00, 'version': 1},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assessment_score.refresh_from_db()
        self.assertEqual(self.assessment_score.score_obtained, 95.00)
        self.assertEqual(self.assessment_score.version, 2)

        # Confirm automatic recalculation of final Grade
        self.grade.refresh_from_db()
        self.assertEqual(self.grade.raw_total_score, 95.00)
        self.assertEqual(self.grade.grade_letter, 'A')

    def test_optimistic_locking_prevents_dirty_writes(self):
        """Updating assessment score with stale version yields 409 Conflict."""
        self.client.force_authenticate(user=self.teacher)
        
        # Concurrent update simulations
        response1 = self.client.patch(
            f'/api/v1/results/assessment-scores/{self.assessment_score.id}/',
            {'score_obtained': 80.00, 'version': 1},
            format='json'
        )
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        response2 = self.client.patch(
            f'/api/v1/results/assessment-scores/{self.assessment_score.id}/',
            {'score_obtained': 90.00, 'version': 1}, # Stale version!
            format='json'
        )
        self.assertEqual(response2.status_code, status.HTTP_409_CONFLICT)

    def test_teacher_cannot_grade_other_offerings(self):
        """Teacher cannot edit scores for offerings they are not assigned to."""
        other_teacher = User.objects.create_user(
            email='other_teacher@test.com',
            password='testpass123',
            role=User.Role.TEACHER
        )
        self.client.force_authenticate(user=other_teacher)
        response = self.client.patch(
            f'/api/v1/results/assessment-scores/{self.assessment_score.id}/',
            {'score_obtained': 85.00, 'version': 1},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_can_lock_grades(self):
        """Teacher can submit grades to lock them from further edits."""
        self.assessment_score.score_obtained = 92.00
        self.assessment_score.save()
        self.grade.raw_total_score = 92.00
        self.grade.save()

        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(f'/api/v1/results/{self.grade.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.grade.refresh_from_db()
        self.assertEqual(self.grade.status, Grade.Status.LOCKED)

        # Teacher should no longer be allowed to modify scores once grade is locked
        response_edit = self.client.patch(
            f'/api/v1/results/assessment-scores/{self.assessment_score.id}/',
            {'score_obtained': 99.00, 'version': 2},
            format='json'
        )
        self.assertEqual(response_edit.status_code, status.HTTP_403_FORBIDDEN)

    def test_dept_head_can_release_locked_grades(self):
        """Department head can release locked grades to students."""
        self.grade.status = Grade.Status.LOCKED
        self.grade.save()

        self.client.force_authenticate(user=self.dept_head)
        response = self.client.post(f'/api/v1/results/{self.grade.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.grade.refresh_from_db()
        self.assertEqual(self.grade.status, Grade.Status.RELEASED)

    def test_student_can_only_view_released_grades(self):
        """Student cannot see grades unless status is Released."""
        self.client.force_authenticate(user=self.student)

        # 1. Draft state -> not visible (paginated response has count=0)
        Grade.objects.filter(pk=self.grade.pk).update(status=Grade.Status.DRAFT)
        response_draft = self.client.get('/api/v1/results/')
        self.assertEqual(response_draft.status_code, status.HTTP_200_OK)
        # Pagination wraps results: {'count': N, 'results': [...]}
        draft_results = response_draft.data.get('results', response_draft.data)
        self.assertEqual(len(draft_results), 0)

        # 2. Released state -> visible (count=1)
        Grade.objects.filter(pk=self.grade.pk).update(status=Grade.Status.RELEASED)
        response_released = self.client.get('/api/v1/results/')
        self.assertEqual(response_released.status_code, status.HTTP_200_OK)
        released_results = response_released.data.get('results', response_released.data)
        self.assertEqual(len(released_results), 1)

    def test_audit_logs_record_mutations(self):
        """Grade modifications must produce an AcademicAuditLog entry."""
        self.client.force_authenticate(user=self.teacher)
        self.client.patch(
            f'/api/v1/results/assessment-scores/{self.assessment_score.id}/',
            {'score_obtained': 88.00, 'version': 1},
            format='json'
        )

        logs = AcademicAuditLog.objects.filter(table_name='assessment_scores')
        self.assertTrue(logs.exists())
        self.assertEqual(logs.first().action, 'UPDATE')
