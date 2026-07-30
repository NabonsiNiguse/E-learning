from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Avg, Sum, FloatField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta

from users.models import User
from courses.models import Course, Lesson, CourseOffering
from enrollments.models import Enrollment
from progress.models import Progress, CourseProgress
from payments.models import Payment
from users.permissions import IsAdmin, IsTeacher, IsStudent
from attendance.models import AttendanceRecord
from courses.models import Assignment, AssignmentSubmission, Quiz, QuizSubmission


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

        # Additional stats requested for unified /stats/ endpoint
        # Pending assignments/quizzes not submitted
        pending_assignments = 0
        pending_quizzes = 0
        if course_ids:
            pending_assignments = Assignment.objects.filter(course_id__in=course_ids).exclude(submissions__student=student).count()
            pending_quizzes = Quiz.objects.filter(course_id__in=course_ids, is_published=True).exclude(submissions__student=student).count()

        # Attendance rate
        attendance_agg = AttendanceRecord.objects.filter(student=student).aggregate(
            total=Count('id'), present=Count('id', filter=Q(status='present'))
        )
        total_att = attendance_agg.get('total') or 0
        present_att = attendance_agg.get('present') or 0
        attendance_rate = round((present_att / total_att * 100), 1) if total_att else 0.0

        # Recent grades (combine assignment and quiz submissions)
        recent_assign = AssignmentSubmission.objects.filter(student=student, grade__isnull=False).order_by('-submitted_at').values('id', 'assignment__title', 'grade', 'submitted_at')[:5]
        recent_quiz = QuizSubmission.objects.filter(student=student, score__isnull=False).order_by('-submitted_at').values('id', 'quiz__title', 'score', 'submitted_at')[:5]

        recent = []
        for a in recent_assign:
            recent.append({'type': 'assignment', 'title': a['assignment__title'], 'score': float(a['grade']), 'date': a['submitted_at']})
        for q in recent_quiz:
            recent.append({'type': 'quiz', 'title': q['quiz__title'], 'score': float(q['score']), 'date': q['submitted_at']})
        recent = sorted(recent, key=lambda x: x['date'], reverse=True)[:10]

        return Response({
            'success': True,
            'data': {
                'total_enrolled': len(enrolled_data),
                'active_courses': len(active),
                'locked_courses': len(locked),
                'completed_courses': len(completed),
                'enrollments': enrolled_data,
                'pending_assignments': pending_assignments,
                'pending_quizzes': pending_quizzes,
                'attendance_rate': attendance_rate,
                'recent_grades': recent,
            }
        })


# ---------------------------------------------------------------------------
# Unified role-based stats endpoint
# ---------------------------------------------------------------------------
class DashboardStatsView(APIView):
    """
    GET /api/v1/dashboard/stats/
    Returns role-based live statistics for ADMIN, TEACHER, STUDENT.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # ADMIN stats
        if user.is_admin:
            # Users counts
            user_counts = User.objects.aggregate(
                total=Coalesce(Count('id'), 0),
                teachers=Coalesce(Count('id', filter=Q(role='teacher')), 0),
                students=Coalesce(Count('id', filter=Q(role='student')), 0),
            )

            active_courses = Course.objects.filter(status='published').count()
            total_enrollments = Enrollment.objects.count()

            # Platform-wide attendance
            att = AttendanceRecord.objects.aggregate(
                total=Coalesce(Count('id'), 0),
                present=Coalesce(Count('id', filter=Q(status='present')), 0),
            )
            att_total = att['total'] or 0
            att_present = att['present'] or 0
            avg_attendance = round((att_present / att_total * 100), 1) if att_total else 0.0

            return Response({'success': True, 'role': 'admin', 'data': {
                'users_total': int(user_counts['total']),
                'teachers': int(user_counts['teachers']),
                'students': int(user_counts['students']),
                'active_courses': int(active_courses),
                'total_enrollments': int(total_enrollments),
                'platform_average_attendance': avg_attendance,
            }})

        # TEACHER stats
        if user.is_teacher:
            teacher = user
            courses_qs = Course.objects.filter(offerings__instructor=teacher).distinct()
            course_count = courses_qs.count()

            total_students = Enrollment.objects.filter(course_offering__instructor=teacher, status__in=['active','completed']).values('student').distinct().count()

            pending_submissions = AssignmentSubmission.objects.filter(assignment__course__offerings__instructor=teacher, status='submitted').count()

            att = AttendanceRecord.objects.filter(course_offering__instructor=teacher).aggregate(
                total=Coalesce(Count('id'), 0),
                present=Coalesce(Count('id', filter=Q(status='present')), 0),
            )
            att_total = att['total'] or 0
            att_present = att['present'] or 0
            avg_attendance = round((att_present / att_total * 100), 1) if att_total else 0.0

            return Response({'success': True, 'role': 'teacher', 'data': {
                'course_count': int(course_count),
                'total_unique_students': int(total_students),
                'pending_submissions_to_grade': int(pending_submissions),
                'average_attendance': avg_attendance,
            }})

        # STUDENT stats
        if user.is_student:
            student = user
            enroll_count = Enrollment.objects.filter(student=student).count()
            # course progress
            progresses = CourseProgress.objects.filter(student=student).select_related('course')
            progress_list = []
            for p in progresses:
                progress_list.append({
                    'course_id': p.course_id,
                    'course_title': p.course.title,
                    'percent_complete': float(p.percent_complete),
                })

            # pending assignments/quizzes
            course_ids = list(Enrollment.objects.filter(student=student).values_list('course_offering__course_id', flat=True))
            pending_assignments = Assignment.objects.filter(course_id__in=course_ids).exclude(submissions__student=student).count() if course_ids else 0
            pending_quizzes = Quiz.objects.filter(course_id__in=course_ids, is_published=True).exclude(submissions__student=student).count() if course_ids else 0

            # attendance rate
            att = AttendanceRecord.objects.filter(student=student).aggregate(
                total=Coalesce(Count('id'), 0),
                present=Coalesce(Count('id', filter=Q(status='present')), 0),
            )
            att_total = att['total'] or 0
            att_present = att['present'] or 0
            attendance_rate = round((att_present / att_total * 100), 1) if att_total else 0.0

            # recent grades
            recent_assign = AssignmentSubmission.objects.filter(student=student, grade__isnull=False).order_by('-submitted_at').values('assignment__title', 'grade', 'submitted_at')[:5]
            recent_quiz = QuizSubmission.objects.filter(student=student, score__isnull=False).order_by('-submitted_at').values('quiz__title', 'score', 'submitted_at')[:5]
            recent = []
            for a in recent_assign:
                recent.append({'type': 'assignment', 'title': a['assignment__title'], 'score': float(a['grade']), 'date': a['submitted_at']})
            for q in recent_quiz:
                recent.append({'type': 'quiz', 'title': q['quiz__title'], 'score': float(q['score']), 'date': q['submitted_at']})
            recent = sorted(recent, key=lambda x: x['date'], reverse=True)[:10]

            return Response({'success': True, 'role': 'student', 'data': {
                'enrolled_courses_count': int(enroll_count),
                'course_progress': progress_list,
                'pending_assignments': int(pending_assignments),
                'pending_quizzes': int(pending_quizzes),
                'attendance_rate': attendance_rate,
                'recent_grades': recent,
            }})

        # Fallback
        return Response({'success': False, 'message': 'Unsupported role for dashboard stats.'}, status=403)
