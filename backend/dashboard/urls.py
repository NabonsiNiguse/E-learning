from django.urls import path
from .views import AdminDashboardView, TeacherDashboardView, StudentDashboardView, DashboardStatsView

urlpatterns = [
    path('admin/',   AdminDashboardView.as_view(),   name='dashboard-admin'),
    path('teacher/', TeacherDashboardView.as_view(),  name='dashboard-teacher'),
    path('student/', StudentDashboardView.as_view(),  name='dashboard-student'),
    path('stats/',   DashboardStatsView.as_view(),    name='dashboard-stats'),
]
