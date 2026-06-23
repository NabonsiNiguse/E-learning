from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from users.models import User
from courses.models import Course, Lesson, CourseOffering
from enrollments.models import Enrollment
from progress.models import Progress
from payments.models import Payment
from users.permissions import IsAdmin, IsTeacher, IsStudent


class AdminDashboardView(APIView):
    """
    GET /api/v1/dashboard/admin/
    Comprehensive platform statistics for admins.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        now = timezone.now()
        last_30 = now - timedelta(days=30)

        user_stats = User.objects.aggregate(
            total=Count('id'),
            teachers=Count('id', filter=Q(role='teacher')),
            students=Count('id', filter=Q(role='student')),
            new_users=Count('id', filter=Q(created_at__gte=last_30))
        )

        course_stats = Course.objects.aggregate(
            total=Count('id'),
            published=Count('id', filter=Q(status='published'))
        )

        enrollment_stats = Enrollment.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(status='active')),
            new_enrollments=Count('id', filter=Q(enrolled_at__gte=last_30))
        )

        payment_stats = Payment.objects.aggregate(
            total_revenue=Count('id', filter=Q(status='success')),
            new_payments=Count('id', filter=Q(created_at__gte=last_30, status='success'))
        )

        top_courses = (
            Course.objects
            .annotate(enroll_count=Count('offerings__enrollments', filter=Q(offerings__enrollments__status='active')))
            .order_by('-enroll_count')[:5]
            .values('id', 'title', 'enroll_count')
        )

        return Response({
            'success': True,
            'data': {
                'totals': {
                    'users': user_stats['total'],
                    'teachers': user_stats['teachers'],
                    'students': user_stats['students'],
                    'courses': course_stats['total'],
                    'published_courses': course_stats['published'],
                    'enrollments': enrollment_stats['total'],
                    'active_enrollments': enrollment_stats['active'],
                    'successful_payments': payment_stats['total_revenue'],
                },
                'last_30_days': {
                    'new_users': user_stats['new_users'],
                    'new_enrollments': enrollment_stats['new_enrollments'],
                    'new_payments': payment_stats['new_payments'],
                },
                'top_courses': list(top_courses),
            }
        })


class TeacherDashboardView(APIView):
    """
    GET /api/v1/dashboard/teacher/
    Stats for the authenticated teacher.
    """
    permission_classes = [IsTeacher]

    def get(self, request):
        teacher = request.user
        courses = Course.objects.filter(offerings__instructor=teacher).distinct().annotate(
            _student_count=Count('offerings__enrollments', filter=Q(offerings__enrollments__status__in=['active', 'completed'])),
            _lesson_count=Count('lessons'),
        )

        course_data = []
        for c in courses:
            course_data.append({
                'id':            c.id,
                'title':         c.title,
                'status':        c.status,
                'is_premium':    c.is_premium,
                'student_count': c._student_count,
                'lesson_count':  c._lesson_count,
            })

        total_students = Enrollment.objects.filter(
            course_offering__instructor=teacher,
            status__in=['active', 'completed'],
        ).values('student').distinct().count()

        return Response({
            'success': True,
            'data': {
                'total_courses':  courses.count(),
                'total_students': total_students,
                'total_lessons':  Lesson.objects.filter(course__offerings__instructor=teacher).distinct().count(),
                'courses':        course_data,
            }
        })


class StudentDashboardView(APIView):
    """
    GET /api/v1/dashboard/student/
    """
    permission_classes = [IsStudent]

    def get(self, request):
        student = request.user
        enrollments = Enrollment.objects.filter(student=student).select_related('course_offering__course')

        course_ids = [e.course_offering.course_id for e in enrollments if e.course_offering]

        lesson_counts = dict(
            Lesson.objects.filter(
                course_id__in=course_ids, status='published'
            ).values('course_id').annotate(count=Count('id')).values_list('course_id', 'count')
        )

        completed_progress = Progress.objects.filter(
            student=student, lesson__course_id__in=course_ids, completed=True
        ).select_related('lesson').values('lesson__course_id', 'lesson_id')

        completed_by_course = {}
        for prog in completed_progress:
            course_id = prog['lesson__course_id']
            if course_id not in completed_by_course:
                completed_by_course[course_id] = set()
            completed_by_course[course_id].add(prog['lesson_id'])

        all_lessons = Lesson.objects.filter(
            course_id__in=course_ids, status='published'
        ).order_by('course_id', 'order').values('id', 'course_id', 'title', 'order')

        lessons_by_course = {}
        for lesson in all_lessons:
            course_id = lesson['course_id']
            if course_id not in lessons_by_course:
                lessons_by_course[course_id] = []
            lessons_by_course[course_id].append(lesson)

        enrolled_data = []
        for enrollment in enrollments:
            if not enrollment.course_offering:
                continue
            course = enrollment.course_offering.course
            course_id = course.id

            total_lessons = lesson_counts.get(course_id, 0)
            completed_ids = completed_by_course.get(course_id, set())
            completed_lessons = len(completed_ids)
            percentage = round(
                (completed_lessons / total_lessons * 100), 1
            ) if total_lessons else 0

            next_lesson = None
            for lesson in lessons_by_course.get(course_id, []):
                if lesson['id'] not in completed_ids:
                    next_lesson = {
                        'id': lesson['id'],
                        'title': lesson['title'],
                        'order': lesson['order'],
                    }
                    break

            enrolled_data.append({
                'enrollment_id': enrollment.id,
                'enrollment_status': enrollment.status,
                'course_id': course.id,
                'course_title': course.title,
                'is_premium': course.is_premium,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'completion_percentage': percentage,
                'next_lesson': next_lesson,
            })

        active = [e for e in enrolled_data if e['enrollment_status'] == 'active']
        locked = [e for e in enrolled_data if e['enrollment_status'] == 'locked']
        completed = [e for e in enrolled_data if e['enrollment_status'] == 'completed']

        return Response({
            'success': True,
            'data': {
                'total_enrolled': len(enrolled_data),
                'active_courses': len(active),
                'locked_courses': len(locked),
                'completed_courses': len(completed),
                'enrollments': enrolled_data,
            }
        })
