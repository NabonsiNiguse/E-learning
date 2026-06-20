"""
Test role-based endpoint behavior.
Verifies that /results endpoint returns different data per role.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from courses.models import Course
from results.models import StudentResult, GradingScale, GradingRule

User = get_user_model()


class RoleBasedEndpointTestCase(TestCase):
    """Test that /results endpoint returns different data per role."""

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
            letter='B+',
            min_score=85,
            max_score=94.99,
            gpa_points=3.3,
            pass_fail='pass',
        )

        # Create result
        self.result = StudentResult.objects.create(
            student=self.student,
            course=self.course,
            year=2024,
            semester='semester_1',
            raw_score=87.5,
            status=StudentResult.Status.DRAFT,
        )

        self.client = APIClient()

    def test_teacher_gets_only_scores(self):
        """Teacher should get ONLY: student_name, course_title, raw_score."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/v1/results/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        
        result = response.data[0]
        
        # Teacher SHOULD see these fields
        self.assertIn('id', result)
        self.assertIn('student_name', result)
        self.assertIn('course_title', result)
        self.assertIn('year', result)
        self.assertIn('semester', result)
        self.assertIn('raw_score', result)
        
        # Teacher SHOULD NOT see these sensitive computed fields
        self.assertNotIn('grade_letter', result)
        self.assertNotIn('gpa', result)
        self.assertNotIn('pass_fail', result)
        self.assertIn('status', result)
        self.assertNotIn('submitted_at', result)
        self.assertNotIn('approved_at', result)
        self.assertNotIn('student_detail', result)
        
        # Verify values
        self.assertEqual(result['student_name'], 'Student User')
        self.assertEqual(result['course_title'], 'Test Course')
        self.assertEqual(float(result['raw_score']), 87.5)

    def test_student_gets_own_results_with_grades(self):
        """Student should get own results with: course, score, grade, GPA, pass_fail."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/v1/results/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        result = response.data[0]
        
        # Student SHOULD see these fields
        self.assertIn('id', result)
        self.assertIn('course_title', result)
        self.assertIn('course_teacher', result)
        self.assertIn('year', result)
        self.assertIn('semester', result)
        self.assertIn('raw_score', result)
        self.assertIn('grade_letter', result)
        self.assertIn('gpa', result)
        self.assertIn('pass_fail', result)
        
        # Student SHOULD NOT see these fields
        self.assertNotIn('status', result)
        self.assertNotIn('submitted_at', result)
        self.assertNotIn('approved_at', result)
        self.assertNotIn('student_detail', result)
        self.assertNotIn('student_name', result)
        
        # Verify computed values
        self.assertEqual(result['course_title'], 'Test Course')
        self.assertEqual(float(result['raw_score']), 87.5)
        self.assertEqual(result['grade_letter'], 'B+')
        self.assertEqual(result['gpa'], 3.3)
        self.assertEqual(result['pass_fail'], 'pass')

    def test_admin_gets_all_data(self):
        """Admin should get ALL data including status and submission details."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/results/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        
        result = response.data[0]
        
        # Admin SHOULD see all fields
        self.assertIn('id', result)
        self.assertIn('student', result)
        self.assertIn('student_detail', result)
        self.assertIn('course', result)
        self.assertIn('course_title', result)
        self.assertIn('course_teacher', result)
        self.assertIn('year', result)
        self.assertIn('semester', result)
        self.assertIn('raw_score', result)
        self.assertIn('grade_letter', result)
        self.assertIn('gpa', result)
        self.assertIn('pass_fail', result)
        self.assertIn('status', result)
        self.assertIn('submitted_at', result)
        self.assertIn('approved_at', result)
        self.assertIn('unlocked_at', result)
        self.assertIn('created_at', result)
        self.assertIn('updated_at', result)
        
        # Verify values
        self.assertEqual(result['student'], self.student.id)
        self.assertEqual(result['student_detail']['full_name'], 'Student User')
        self.assertEqual(result['course_title'], 'Test Course')
        self.assertEqual(float(result['raw_score']), 87.5)
        self.assertEqual(result['grade_letter'], 'B+')
        self.assertEqual(result['gpa'], 3.3)
        self.assertEqual(result['pass_fail'], 'pass')
        self.assertEqual(result['status'], 'draft')

    def test_teacher_cannot_see_other_teachers_students(self):
        """Teacher should only see students from their own courses."""
        # Create another teacher
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

    def test_student_cannot_see_other_students_results(self):
        """Student should only see their own results."""
        # Create another student
        other_student = User.objects.create_user(
            email='other_student@test.com',
            password='testpass123',
            first_name='Other',
            last_name='Student',
            role=User.Role.STUDENT,
        )
        
        self.client.force_authenticate(user=other_student)
        response = self.client.get('/api/v1/results/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_teacher_cannot_see_grades_in_detail(self):
        """Teacher should not see grades even when viewing detail."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(f'/api/v1/results/{self.result.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        result = response.data
        
        # Teacher SHOULD NOT see grade fields
        self.assertNotIn('grade_letter', result)
        self.assertNotIn('gpa', result)
        self.assertNotIn('pass_fail', result)

    def test_student_sees_grades_in_detail(self):
        """Student should see grades when viewing their own result."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f'/api/v1/results/{self.result.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        result = response.data
        
        # Student SHOULD see grade fields
        self.assertIn('grade_letter', result)
        self.assertIn('gpa', result)
        self.assertIn('pass_fail', result)
        
        # Verify computed values
        self.assertEqual(result['grade_letter'], 'B+')
        self.assertEqual(result['gpa'], 3.3)
        self.assertEqual(result['pass_fail'], 'pass')

    def test_admin_sees_all_fields_in_detail(self):
        """Admin should see all fields including status."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f'/api/v1/results/{self.result.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        result = response.data
        
        # Admin SHOULD see all fields
        self.assertIn('status', result)
        self.assertIn('submitted_at', result)
        self.assertIn('approved_at', result)
        self.assertIn('grade_letter', result)
        self.assertIn('gpa', result)
        self.assertIn('pass_fail', result)
