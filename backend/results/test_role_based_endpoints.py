"""
Role-based endpoint tests: verifies that /api/v1/results/ returns correct data per role.
Roles: Admin (all), DeptHead/Dean (filtered by scope), Teacher (own offerings), Student (own RELEASED only).
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

from courses.models import Faculty, Department, Course, AcademicSemester, CourseOffering
from enrollments.models import Enrollment
from results.models import Grade, GradingScale, GradingRule

User = get_user_model()


def get_results(response):
    """
    Helper that unwraps a DRF paginated list response.
    Returns the list of results regardless of whether pagination is active.
    Paginated: {'count': N, 'results': [...]}
    Unpaginated: [...]
    """
    data = response.data
    if isinstance(data, dict) and 'results' in data:
        return data['results']
    return data


class RoleBasedGradeEndpointTests(TestCase):
    """Test that /api/v1/results/ filters and serializes differently per role."""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role=User.Role.ADMIN,
            first_name='Admin', last_name='User',
        )
        self.dean = User.objects.create_user(
            email='dean@test.com', password='pass', role=User.Role.DEAN,
            first_name='Dean', last_name='User',
        )
        self.dept_head = User.objects.create_user(
            email='head@test.com', password='pass', role=User.Role.DEPT_HEAD,
            first_name='Head', last_name='User',
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass', role=User.Role.TEACHER,
            first_name='Teacher', last_name='User',
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass', role=User.Role.STUDENT,
            first_name='Student', last_name='User',
        )

        # Build hierarchy
        self.faculty = Faculty.objects.create(name='Engineering', code='ENG', dean=self.dean)
        self.dept = Department.objects.create(
            faculty=self.faculty, name='Computer Science', code='CS', head=self.dept_head
        )
        self.course = Course.objects.create(
            department=self.dept, title='Data Structures', slug='ds-101',
            description='Test', status=Course.Status.PUBLISHED,
        )
        self.semester = AcademicSemester.objects.create(year=2024, semester='Fall', is_active=True)
        self.offering = CourseOffering.objects.create(
            course=self.course, semester=self.semester,
            instructor=self.teacher, section_code='A', max_capacity=30,
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student, course_offering=self.offering,
            status=Enrollment.Status.ACTIVE,
        )

        # GradingScale
        self.scale = GradingScale.objects.create(name='Scale', is_active=True, created_by=self.admin)
        GradingRule.objects.create(
            scale=self.scale, letter='B+', min_score=Decimal('85'),
            max_score=Decimal('94.99'), gpa_points=Decimal('3.3'), pass_fail='pass',
        )

        # Grade — RELEASED so student assertions see exactly 1 result
        self.grade = Grade.objects.create(
            enrollment=self.enrollment,
            raw_total_score=Decimal('87.5'),
            status=Grade.Status.RELEASED,
            version=1,
        )

        self.client = APIClient()

    # -----------------------------------------------------------------------
    # Admin
    # -----------------------------------------------------------------------

    def test_admin_sees_all_grades(self):
        """Admin sees every grade across all departments."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(get_results(response)), 1)

    # -----------------------------------------------------------------------
    # Teacher
    # -----------------------------------------------------------------------

    def test_teacher_sees_own_offering_grades(self):
        """Teacher sees grades only for their own offering."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_results(response)), 1)

    def test_other_teacher_sees_no_grades(self):
        """A teacher not assigned to any offering gets an empty list."""
        other = User.objects.create_user(
            email='other@test.com', password='pass', role=User.Role.TEACHER
        )
        self.client.force_authenticate(user=other)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_results(response)), 0)

    # -----------------------------------------------------------------------
    # Student
    # -----------------------------------------------------------------------

    def test_student_sees_only_own_released_grades(self):
        """Student can only see their own RELEASED grades."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = get_results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.grade.id)

    def test_student_cannot_see_draft_grade(self):
        """Student gets zero results when grade is DRAFT."""
        # Use direct DB update to avoid save() override touching status logic
        Grade.objects.filter(pk=self.grade.pk).update(status=Grade.Status.DRAFT)
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_results(response)), 0)

    def test_other_student_sees_no_grades(self):
        """Another student cannot see anyone else's grades."""
        other = User.objects.create_user(
            email='other_student@test.com', password='pass', role=User.Role.STUDENT
        )
        self.client.force_authenticate(user=other)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_results(response)), 0)

    def test_student_cannot_modify_grade(self):
        """Student cannot PATCH a grade."""
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(
            f'/api/v1/results/{self.grade.id}/',
            {'raw_total_score': 100},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # -----------------------------------------------------------------------
    # Dean / DeptHead
    # -----------------------------------------------------------------------

    def test_dept_head_sees_department_grades(self):
        """Department head can view all grades within their department."""
        self.client.force_authenticate(user=self.dept_head)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(get_results(response)), 1)

    def test_dean_sees_faculty_grades(self):
        """Dean can view all grades within their faculty."""
        self.client.force_authenticate(user=self.dean)
        response = self.client.get('/api/v1/results/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(get_results(response)), 1)

    # -----------------------------------------------------------------------
    # Grade submission workflow
    # -----------------------------------------------------------------------

    def test_teacher_can_lock_draft_grade(self):
        """Teacher can submit/lock a grade with a score."""
        self.grade.status = Grade.Status.DRAFT
        self.grade.save()
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(f'/api/v1/results/{self.grade.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.grade.refresh_from_db()
        self.assertEqual(self.grade.status, Grade.Status.LOCKED)

    def test_dept_head_can_release_locked_grade(self):
        """DeptHead can approve/release a locked grade."""
        self.grade.status = Grade.Status.LOCKED
        self.grade.save()
        self.client.force_authenticate(user=self.dept_head)
        response = self.client.post(f'/api/v1/results/{self.grade.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.grade.refresh_from_db()
        self.assertEqual(self.grade.status, Grade.Status.RELEASED)

    def test_admin_can_unlock_grade(self):
        """Admin can unlock a locked/released grade back to draft."""
        self.grade.status = Grade.Status.LOCKED
        self.grade.save()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f'/api/v1/results/{self.grade.id}/unlock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.grade.refresh_from_db()
        self.assertEqual(self.grade.status, Grade.Status.DRAFT)

    def test_student_cannot_use_submit_action(self):
        """Student cannot call the submit action (only teachers can)."""
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/v1/results/{self.grade.id}/submit/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
