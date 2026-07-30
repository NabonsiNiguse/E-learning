"""
Management command: python manage.py seed
Seeds the database with realistic sample data for development/testing.

This command creates:
 - 1 Admin (admin@elearn.com / admin123)
 - 2 Teachers (alice.morgan@example.com, bob.taylor@example.com)
 - 5 Students (dan.smith@example.com, emma.jones@example.com, liam.brown@example.com, olivia.green@example.com, noah.white@example.com)
 - 3 Courses, each with modules, lessons, 1 quiz (5 questions), and 1 assignment
 - CourseOfferings, Enrollments, QuizSubmissions, AssignmentSubmissions (some graded), AttendanceRecords, Notifications
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

# Import models
from users.models import User, TeacherProfile, StudentProfile
from courses.models import (Course, Module, Lesson, Assignment, AssignmentSubmission,
                            Quiz, Question, Choice, QuizSubmission, StudentAnswer,
                            AcademicSemester, CourseOffering)
from enrollments.models import Enrollment
from progress.models import Progress, CourseProgress
from payments.models import Payment
from attendance.models import AttendanceRecord
from notifications.models import Notification

import datetime
import uuid


ADMIN_CREDENTIALS = {'email': 'admin@elearn.com', 'password': 'admin123', 'first_name': 'Platform', 'last_name': 'Admin'}
TEACHERS = [
    {'email': 'alice.morgan@example.com', 'first_name': 'Alice', 'last_name': 'Morgan', 'bio': 'Senior Software Engineer', 'expertise': 'Web Development'},
    {'email': 'bob.taylor@example.com',   'first_name': 'Bob',   'last_name': 'Taylor', 'bio': 'Data Scientist & Instructor', 'expertise': 'Data Science'},
]
STUDENTS = [
    {'email': 'dan.smith@example.com',   'first_name': 'Dan',    'last_name': 'Smith'},
    {'email': 'emma.jones@example.com',  'first_name': 'Emma',   'last_name': 'Jones'},
    {'email': 'liam.brown@example.com',  'first_name': 'Liam',   'last_name': 'Brown'},
    {'email': 'olivia.green@example.com','first_name': 'Olivia', 'last_name': 'Green'},
    {'email': 'noah.white@example.com',  'first_name': 'Noah',   'last_name': 'White'},
]

COURSES_SPEC = [
    {
        'title': 'Full-Stack Web Development',
        'description': 'From frontend to backend: build production-ready web apps.',
        'is_premium': False,
        'price': 0,
        'modules': [
            {'title': 'Frontend Basics', 'lessons': ['HTML & CSS', 'JavaScript Basics']},
            {'title': 'Frontend Frameworks', 'lessons': ['React Intro', 'State & Props']},
            {'title': 'Backend & APIs', 'lessons': ['Django REST', 'Authentication']},
        ]
    },
    {
        'title': 'Data Science with Python',
        'description': 'Analyze data and build ML models using Python.',
        'is_premium': True,
        'price': 49.99,
        'modules': [
            {'title': 'Python for Data', 'lessons': ['Python Basics', 'Pandas Intro']},
            {'title': 'Data Visualization', 'lessons': ['Matplotlib', 'Seaborn']},
            {'title': 'Intro to ML', 'lessons': ['Supervised Learning', 'Model Evaluation']},
        ]
    },
    {
        'title': 'UX & Product Design',
        'description': 'Design delightful products with great UX practices.',
        'is_premium': False,
        'price': 0,
        'modules': [
            {'title': 'Design Principles', 'lessons': ['Color & Typography', 'Layout']},
            {'title': 'Research', 'lessons': ['User Research', 'Personas']},
            {'title': 'Prototyping', 'lessons': ['Wireframes', 'Interactive Prototypes']},
        ]
    },
]


class Command(BaseCommand):
    help = 'Seed the database with sample e-learning data'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Starting database seeding...')

        # Admin
        admin, _ = User.objects.get_or_create(email=ADMIN_CREDENTIALS['email'], defaults={
            'first_name': ADMIN_CREDENTIALS['first_name'], 'last_name': ADMIN_CREDENTIALS['last_name'],
            'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True,
        })
        admin.set_password(ADMIN_CREDENTIALS['password'])
        admin.save()
        self.stdout.write(f'Created admin: {admin.email}')

        # Teachers
        teachers = []
        for t in TEACHERS:
            user, _ = User.objects.get_or_create(email=t['email'], defaults={
                'first_name': t['first_name'], 'last_name': t['last_name'], 'role': User.Role.TEACHER,
            })
            user.set_password('Teacher@1234')
            user.save()
            TeacherProfile.objects.get_or_create(user=user, defaults={'bio': t.get('bio', ''), 'expertise': t.get('expertise', '')})
            teachers.append(user)
            self.stdout.write(f'Created teacher: {user.email}')

        # Students
        students = []
        for s in STUDENTS:
            user, _ = User.objects.get_or_create(email=s['email'], defaults={
                'first_name': s['first_name'], 'last_name': s['last_name'], 'role': User.Role.STUDENT,
            })
            user.set_password('Student@1234')
            user.save()
            StudentProfile.objects.get_or_create(user=user)
            students.append(user)
            self.stdout.write(f'Created student: {user.email}')

        # Academic semester and offerings
        today = datetime.date.today()
        semester, _ = AcademicSemester.objects.get_or_create(year=today.year, semester='Summer', defaults={'is_active': True})

        created_courses = []
        for idx, spec in enumerate(COURSES_SPEC):
            slug_base = spec['title'].lower().replace(' ', '-')
            slug = slug_base
            i = 1
            while Course.objects.filter(slug=slug).exists():
                slug = f'{slug_base}-{i}'; i += 1

            creator = teachers[idx % len(teachers)]
            course, _ = Course.objects.get_or_create(title=spec['title'], defaults={
                'description': spec['description'], 'is_premium': spec['is_premium'], 'price': spec['price'],
                'slug': slug, 'created_by': creator,
            })
            created_courses.append(course)
            self.stdout.write(f'Created course: {course.title}')

            # Course offering
            offering, _ = CourseOffering.objects.get_or_create(course=course, semester=semester, section_code='A', defaults={'instructor': creator})

            # Modules and Lessons
            order_l = 1
            for m_idx, m in enumerate(spec['modules'], start=1):
                module, _ = Module.objects.get_or_create(course=course, title=m['title'], defaults={'order': m_idx})
                for lesson_title in m['lessons']:
                    Lesson.objects.get_or_create(course=course, order=order_l, defaults={'title': lesson_title, 'description': lesson_title, 'created_by': creator, 'status': 'published'})
                    order_l += 1

            # Quiz with 5 questions
            quiz, _ = Quiz.objects.get_or_create(course=course, title=f'{course.title} — Quiz 1', defaults={'is_published': True})
            for qn in range(1, 6):
                question, _ = Question.objects.get_or_create(quiz=quiz, order=qn, defaults={'text': f'Question {qn} for {course.title}', 'question_type': Question.Type.MCQ, 'points': 1})
                # ensure exactly 4 choices
                if question.choices.count() < 4:
                    for ci in range(4):
                        Choice.objects.create(question=question, text=f'Option {ci+1}', is_correct=(ci == 0))

            # Assignment
            assignment, _ = Assignment.objects.get_or_create(course=course, title=f'{course.title} — Assignment 1', defaults={'total_marks': 100})

            # Enroll some students
            for student in students[:4]:
                Enrollment.objects.get_or_create(student=student, course_offering=offering, defaults={'status': Enrollment.Status.ACTIVE})

            # Create sample quiz submissions and assignment submissions
            for si, student in enumerate(students):
                # Quiz submission
                quiz_submission = QuizSubmission.objects.create(student=student, quiz=quiz)
                for q in quiz.questions.all():
                    choice = q.choices.first()
                    StudentAnswer.objects.create(submission=quiz_submission, question=q, selected_choice=choice, is_correct=choice.is_correct, points_awarded=(q.points if choice.is_correct else 0))
                quiz_submission.grade_submission()

                # Assignment submission: grade some, leave some pending
                asub, _ = AssignmentSubmission.objects.get_or_create(student=student, assignment=assignment, defaults={'submission_text': 'Here is my work.', 'status': AssignmentSubmission.Status.SUBMITTED})
                if si % 2 == 0:
                    asub.grade = 90
                    asub.feedback = 'Well done.'
                    asub.status = AssignmentSubmission.Status.GRADED
                    asub.save()

            # Attendance records for today
            for student in students[:4]:
                AttendanceRecord.objects.get_or_create(student=student, course_offering=offering, date=today, defaults={'status': AttendanceRecord.Status.PRESENT, 'marked_by': creator})

            # Notifications
            for student in students:
                Notification.objects.get_or_create(recipient=student, title=f'New course: {course.title}', defaults={'notification_type': Notification.Type.COURSE_UPDATE, 'message': f'{course.title} is now available.'})

        # Update CourseProgress for students
        for student in students:
            for course in created_courses:
                total_lessons = course.lessons.count()
                completed = Progress.objects.filter(student=student, lesson__course=course, completed=True).count()
                percent = (completed / total_lessons * 100) if total_lessons else 0
                cp, _ = CourseProgress.objects.get_or_create(student=student, course=course, defaults={'completed_lessons': completed, 'total_lessons': total_lessons, 'percent_complete': percent})
                cp.completed_lessons = completed
                cp.total_lessons = total_lessons
                cp.percent_complete = percent
                cp.save()

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
        self.stdout.write('Credentials:')
        self.stdout.write(f" Admin: {ADMIN_CREDENTIALS['email']} / {ADMIN_CREDENTIALS['password']}")
        self.stdout.write(' Teachers: alice.morgan@example.com, bob.taylor@example.com  (password: Teacher@1234)')
        self.stdout.write(' Students: dan.smith@example.com, emma.jones@example.com, liam.brown@example.com, olivia.green@example.com, noah.white@example.com  (password: Student@1234)')
