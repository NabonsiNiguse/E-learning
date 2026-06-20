"""
Management command: python manage.py seed
Seeds the database with realistic sample data for development/testing.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User, TeacherProfile, StudentProfile
from courses.models import Course, Lesson
from enrollments.models import Enrollment
from progress.models import Progress
from payments.models import Payment
from notifications.models import Notification
import uuid


TEACHERS = [
    {'email': 'nabonsi@learnly.io',  'first_name': 'Nabonsi', 'last_name': 'Niguse',
     'bio': 'Full-stack developer and educator with 8 years of experience.', 'expertise': 'Web Development'},
    {'email': 'lemi@learnly.io',     'first_name': 'Lemi',    'last_name': 'Melkamu',
     'bio': 'UI/UX designer and product strategist.', 'expertise': 'Design & Marketing'},
]

STUDENTS = [
    {'email': 'keab@learnly.io',    'first_name': 'Keab',    'last_name': 'Niguse'},
    {'email': 'eyob@learnly.io',    'first_name': 'Eyob',    'last_name': 'Haile'},
    {'email': 'mikiyas@learnly.io', 'first_name': 'Mikiyas', 'last_name': 'Niguse'},
    {'email': 'niguse@learnly.io',  'first_name': 'Niguse',  'last_name': 'Tsegaye'},
    {'email': 'john@learnly.io',    'first_name': 'John',    'last_name': 'Wabskill'},
]

COURSES_DATA = [
    {
        'title': 'Modern Web Development',
        'description': 'Master React, TypeScript and modern tooling to ship production apps.',
        'category': 'Development', 'is_premium': False, 'price': 0,
        'status': 'published', 'tags': 'react,typescript,web',
        'lessons': [
            {'title': 'Introduction & Setup',    'order': 1, 'duration_min': 8,  'status': 'published',
             'description': 'Get your development environment ready.',
             'video_url': 'https://www.youtube-nocookie.com/embed/BYbgopx44vo'},
            {'title': 'Components & Props',      'order': 2, 'duration_min': 12, 'status': 'published',
             'description': 'Build reusable UI components.',
             'video_url': 'https://www.youtube-nocookie.com/embed/fYq5PXgSsbE'},
            {'title': 'State and Hooks',         'order': 3, 'duration_min': 15, 'status': 'published',
             'description': 'Master useState and useEffect.',
             'video_url': 'https://www.youtube-nocookie.com/embed/3VClygDRSsU'},
            {'title': 'Routing Patterns',        'order': 4, 'duration_min': 11, 'status': 'published',
             'description': 'Build multi-page apps with React Router.',
             'video_url': 'https://www.youtube-nocookie.com/embed/nViEqpgwxHE'},
            {'title': 'Data Fetching',           'order': 5, 'duration_min': 18, 'status': 'published',
             'description': 'Fetch data from REST APIs.',
             'video_url': 'https://www.youtube-nocookie.com/embed/AhSvKGTh28Q'},
        ],
    },
    {
        'title': 'UI/UX Design Foundations',
        'description': 'Learn the principles of beautiful, usable interface design.',
        'category': 'Design', 'is_premium': False, 'price': 0,
        'status': 'published', 'tags': 'ux,design,figma',
        'lessons': [
            {'title': 'Design Principles',       'order': 1, 'duration_min': 14, 'status': 'published',
             'description': 'Core principles of visual design.',
             'video_url': 'https://www.youtube-nocookie.com/embed/YyN0YTmmC3I'},
            {'title': 'Wireframing with Figma',  'order': 2, 'duration_min': 20, 'status': 'published',
             'description': 'Build wireframes and prototypes.',
             'video_url': 'https://www.youtube-nocookie.com/embed/Iqf4J2eDMio'},
            {'title': 'Color & Typography',      'order': 3, 'duration_min': 16, 'status': 'published',
             'description': 'Choosing colors and fonts that work.',
             'video_url': 'https://www.youtube-nocookie.com/embed/txMdrV1Ut64'},
        ],
    },
    {
        'title': 'Data Science with Python',
        'description': 'From pandas to ML — build a real data project end-to-end.',
        'category': 'Data', 'is_premium': True, 'price': 69,
        'status': 'published', 'tags': 'python,data,ml',
        'lessons': [
            {'title': 'Python for Data Science',  'order': 1, 'duration_min': 20, 'status': 'published',
             'description': 'Python basics for data work.',
             'video_url': 'https://www.youtube-nocookie.com/embed/AhSvKGTh28Q'},
            {'title': 'Pandas & NumPy',           'order': 2, 'duration_min': 35, 'status': 'published',
             'description': 'Data manipulation with pandas.',
             'video_url': 'https://www.youtube-nocookie.com/embed/txMdrV1Ut64'},
            {'title': 'Data Visualisation',       'order': 3, 'duration_min': 28, 'status': 'published',
             'description': 'Charts and graphs with matplotlib.',
             'video_url': 'https://www.youtube-nocookie.com/embed/BYbgopx44vo'},
        ],
    },
    {
        'title': 'Digital Marketing Mastery',
        'description': 'Grow brands with SEO, paid ads, and content strategy.',
        'category': 'Marketing', 'is_premium': False, 'price': 0,
        'status': 'published', 'tags': 'marketing,seo,ads',
        'lessons': [
            {'title': 'SEO Fundamentals',         'order': 1, 'duration_min': 18, 'status': 'published',
             'description': 'On-page and off-page SEO.',
             'video_url': 'https://www.youtube-nocookie.com/embed/YyN0YTmmC3I'},
            {'title': 'Paid Advertising',         'order': 2, 'duration_min': 22, 'status': 'published',
             'description': 'Google Ads and Meta Ads basics.',
             'video_url': 'https://www.youtube-nocookie.com/embed/Iqf4J2eDMio'},
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed the database with Ethiopian-named sample data.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # ── Admin ──────────────────────────────────────────────────────────
        admin, _ = User.objects.get_or_create(
            email='ermiyas@learnly.io',
            defaults={
                'first_name': 'Ermiyas', 'last_name': 'Mengistu',
                'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True,
            }
        )
        admin.first_name = 'Ermiyas'
        admin.last_name  = 'Mengistu'
        admin.set_password('Admin@1234')
        admin.save()
        self.stdout.write(f'  Admin: {admin.email}')

        # ── Super Admin ────────────────────────────────────────────────────
        super_admin, _ = User.objects.get_or_create(
            email='academic@learnly.io',
            defaults={
                'first_name': 'Academic', 'last_name': 'Manager',
                'role': User.Role.SUPER_ADMIN, 'is_staff': True, 'is_superuser': True,
            }
        )
        super_admin.first_name = 'Academic'
        super_admin.last_name  = 'Manager'
        super_admin.set_password('SuperAdmin@1234')
        super_admin.save()
        self.stdout.write(f'  Super Admin: {super_admin.email}')

        # ── Teachers ───────────────────────────────────────────────────────
        teacher_users = []
        for t in TEACHERS:
            user, _ = User.objects.get_or_create(
                email=t['email'],
                defaults={
                    'first_name': t['first_name'], 'last_name': t['last_name'],
                    'role': User.Role.TEACHER,
                }
            )
            user.first_name = t['first_name']
            user.last_name  = t['last_name']
            user.set_password('Teacher@1234')
            user.save()
            profile, _ = TeacherProfile.objects.get_or_create(user=user)
            profile.bio       = t['bio']
            profile.expertise = t['expertise']
            profile.save()
            teacher_users.append(user)
            self.stdout.write(f'  Teacher: {user.email}')

        # ── Students ───────────────────────────────────────────────────────
        student_users = []
        for s in STUDENTS:
            user, _ = User.objects.get_or_create(
                email=s['email'],
                defaults={
                    'first_name': s['first_name'], 'last_name': s['last_name'],
                    'role': User.Role.STUDENT,
                }
            )
            user.first_name = s['first_name']
            user.last_name  = s['last_name']
            user.set_password('Student@1234')
            user.save()
            StudentProfile.objects.get_or_create(user=user)
            student_users.append(user)
            self.stdout.write(f'  Student: {user.email}')

        # ── Courses & Lessons ──────────────────────────────────────────────
        created_courses = []
        for idx, course_data in enumerate(COURSES_DATA):
            teacher  = teacher_users[idx % len(teacher_users)]
            lessons  = course_data.pop('lessons')
            slug_base = course_data['title'].lower().replace(' ', '-')
            slug, n  = slug_base, 1
            while Course.objects.filter(slug=slug).exclude(
                teacher=teacher, title=course_data['title']
            ).exists():
                slug = f'{slug_base}-{n}'; n += 1

            course, _ = Course.objects.get_or_create(
                title=course_data['title'],
                teacher=teacher,
                defaults={**course_data, 'slug': slug, 'created_by': teacher},
            )
            created_courses.append(course)
            self.stdout.write(f'  Course: {course.title} → {teacher.email}')

            for lesson_data in lessons:
                Lesson.objects.get_or_create(
                    course=course,
                    order=lesson_data['order'],
                    defaults={**lesson_data, 'created_by': teacher},
                )

        # ── Enrollments & Progress ─────────────────────────────────────────
        free_courses    = [c for c in created_courses if not c.is_premium]
        premium_courses = [c for c in created_courses if c.is_premium]

        # First 3 students enroll in free courses and complete some lessons
        for student in student_users[:3]:
            for course in free_courses:
                enrollment, _ = Enrollment.objects.get_or_create(
                    student=student, course=course,
                    defaults={'status': Enrollment.Status.ACTIVE},
                )
                lessons = list(course.lessons.filter(status='published').order_by('order')[:2])
                for lesson in lessons:
                    Progress.objects.get_or_create(
                        student=student, lesson=lesson,
                        defaults={'completed': True},
                    )

        # Last 2 students pay for premium courses
        for student in student_users[3:]:
            for course in premium_courses[:1]:
                ref = f'PAY-SEED-{uuid.uuid4().hex[:8].upper()}'
                Payment.objects.get_or_create(
                    student=student, course=course,
                    defaults={
                        'amount': course.price, 'status': Payment.Status.SUCCESS,
                        'reference': ref, 'payment_method': 'mock_card',
                    }
                )
                Enrollment.objects.get_or_create(
                    student=student, course=course,
                    defaults={'status': Enrollment.Status.ACTIVE},
                )

        # ── Notifications ──────────────────────────────────────────────────
        for student in student_users[:3]:
            Notification.objects.get_or_create(
                recipient=student,
                title='Welcome to Learnly!',
                defaults={
                    'notification_type': 'system',
                    'message': 'Start exploring courses and track your progress.',
                }
            )

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write('\nCredentials:')
        self.stdout.write('  Super Admin: academic@learnly.io  / SuperAdmin@1234')
        self.stdout.write('  Admin:       ermiyas@learnly.io   / Admin@1234')
        self.stdout.write('  Teacher:     nabonsi@learnly.io   / Teacher@1234')
        self.stdout.write('  Student:     keab@learnly.io      / Student@1234')

COURSES_DATA = [
    {
        'title': 'Complete Python Bootcamp',
        'description': 'Learn Python from scratch to advanced. Covers OOP, file I/O, APIs, and more.',
        'category': 'Programming', 'is_premium': False, 'price': 0,
        'status': 'published', 'tags': 'python,beginner,programming',
        'lessons': [
            {'title': 'Introduction to Python',       'order': 1, 'duration_min': 15, 'status': 'published',
             'description': 'Overview of Python and setting up your environment.',
             'video_url': 'https://example.com/videos/py-intro'},
            {'title': 'Variables and Data Types',     'order': 2, 'duration_min': 20, 'status': 'published',
             'description': 'Understanding Python data types.',
             'video_url': 'https://example.com/videos/py-vars'},
            {'title': 'Control Flow',                 'order': 3, 'duration_min': 25, 'status': 'published',
             'description': 'If statements, loops, and logic.',
             'video_url': 'https://example.com/videos/py-flow'},
            {'title': 'Functions and Modules',        'order': 4, 'duration_min': 30, 'status': 'published',
             'description': 'Writing reusable code.',
             'video_url': 'https://example.com/videos/py-funcs'},
            {'title': 'Object-Oriented Programming',  'order': 5, 'duration_min': 40, 'status': 'published',
             'description': 'Classes, inheritance, and polymorphism.',
             'video_url': 'https://example.com/videos/py-oop'},
        ],
    },
    {
        'title': 'Machine Learning Fundamentals',
        'description': 'Hands-on ML with scikit-learn, pandas, and real datasets.',
        'category': 'Data Science', 'is_premium': True, 'price': 49.99,
        'status': 'published', 'tags': 'ml,data-science,python',
        'lessons': [
            {'title': 'What is Machine Learning?',    'order': 1, 'duration_min': 20, 'status': 'published',
             'description': 'Types of ML and real-world applications.',
             'video_url': 'https://example.com/videos/ml-intro'},
            {'title': 'Data Preprocessing',           'order': 2, 'duration_min': 35, 'status': 'published',
             'description': 'Cleaning and preparing data with pandas.',
             'video_url': 'https://example.com/videos/ml-prep'},
            {'title': 'Linear Regression',            'order': 3, 'duration_min': 45, 'status': 'published',
             'description': 'Building your first predictive model.',
             'video_url': 'https://example.com/videos/ml-linreg'},
            {'title': 'Classification Algorithms',    'order': 4, 'duration_min': 50, 'status': 'published',
             'description': 'Decision trees, KNN, and SVM.',
             'video_url': 'https://example.com/videos/ml-class'},
        ],
    },
    {
        'title': 'UX Design Principles',
        'description': 'Master user research, wireframing, prototyping, and usability testing.',
        'category': 'Design', 'is_premium': False, 'price': 0,
        'status': 'published', 'tags': 'ux,design,figma',
        'lessons': [
            {'title': 'Introduction to UX',           'order': 1, 'duration_min': 18, 'status': 'published',
             'description': 'What UX design is and why it matters.',
             'video_url': 'https://example.com/videos/ux-intro'},
            {'title': 'User Research Methods',        'order': 2, 'duration_min': 30, 'status': 'published',
             'description': 'Interviews, surveys, and usability tests.',
             'video_url': 'https://example.com/videos/ux-research'},
            {'title': 'Wireframing with Figma',       'order': 3, 'duration_min': 40, 'status': 'published',
             'description': 'Building low and high fidelity wireframes.',
             'video_url': 'https://example.com/videos/ux-figma'},
        ],
    },
    {
        'title': 'Advanced Django REST APIs',
        'description': 'Build production-grade APIs with Django, DRF, JWT, and PostgreSQL.',
        'category': 'Programming', 'is_premium': True, 'price': 39.99,
        'status': 'published', 'tags': 'django,api,backend,python',
        'lessons': [
            {'title': 'DRF ViewSets and Routers',     'order': 1, 'duration_min': 30, 'status': 'published',
             'description': 'Efficient API design with ViewSets.',
             'video_url': 'https://example.com/videos/drf-viewsets'},
            {'title': 'JWT Authentication',           'order': 2, 'duration_min': 35, 'status': 'published',
             'description': 'Securing APIs with SimpleJWT.',
             'video_url': 'https://example.com/videos/drf-jwt'},
            {'title': 'Permissions and Throttling',   'order': 3, 'duration_min': 25, 'status': 'published',
             'description': 'Role-based access and rate limiting.',
             'video_url': 'https://example.com/videos/drf-perms'},
        ],
    },
]



