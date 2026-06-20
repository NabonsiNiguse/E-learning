"""
Custom admin site — Learnly Platform Admin
Injects live platform stats into the admin index page.
"""
from django.contrib.admin import AdminSite
from django.db.models import Count, Sum, Q


class LearnlyAdminSite(AdminSite):
    site_header = "Learnly Platform Admin"
    site_title  = "Learnly Admin"
    index_title = "Platform Management"
    site_url    = "http://localhost:5173"

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        try:
            from users.models import User
            from courses.models import Course
            from enrollments.models import Enrollment
            from payments.models import Payment

            total_users    = User.objects.count()
            total_students = User.objects.filter(role='student').count()
            total_teachers = User.objects.filter(role='teacher').count()
            total_courses  = Course.objects.count()
            published      = Course.objects.filter(status='published').count()
            enrollments    = Enrollment.objects.filter(status='active').count()
            revenue        = Payment.objects.filter(status='success').aggregate(
                total=Sum('amount')
            )['total'] or 0

            extra_context['platform_stats'] = [
                {'icon': '👥', 'value': total_users,    'label': 'Total Users'},
                {'icon': '🎓', 'value': total_students, 'label': 'Students'},
                {'icon': '👨‍🏫', 'value': total_teachers, 'label': 'Teachers'},
                {'icon': '📚', 'value': total_courses,  'label': 'Total Courses'},
                {'icon': '✅', 'value': published,      'label': 'Published'},
                {'icon': '📋', 'value': enrollments,    'label': 'Active Enrollments'},
                {'icon': '💰', 'value': f'${revenue:,.2f}', 'label': 'Total Revenue'},
            ]
        except Exception:
            pass  # DB not ready yet (migrations running, etc.)

        return super().index(request, extra_context=extra_context)


admin_site = LearnlyAdminSite(name="learnly_admin")
