"""
Teacher-specific course management URLs.
"""
from django.urls import path
from .teacher_views import (
    TeacherCourseListCreateView,
    TeacherCourseDetailView,
    TeacherSubmitResultsView,
    TeacherLockResultsView,
    TeacherCourseStatsView,
)

urlpatterns = [
    # Course management
    path('', TeacherCourseListCreateView.as_view(), name='teacher-courses-list'),
    path('<int:pk>/', TeacherCourseDetailView.as_view(), name='teacher-course-detail'),
    path('<int:pk>/stats/', TeacherCourseStatsView.as_view(), name='teacher-course-stats'),

    # Results management
    path('<int:pk>/submit-results/', TeacherSubmitResultsView.as_view(), name='teacher-submit-results'),
    path('<int:pk>/lock-results/', TeacherLockResultsView.as_view(), name='teacher-lock-results'),
]
