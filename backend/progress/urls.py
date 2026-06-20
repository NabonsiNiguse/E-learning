from django.urls import path
from .views import ProgressListView, MarkLessonCompleteView, CourseProgressView

urlpatterns = [
    path('',                        ProgressListView.as_view(),      name='progress-list'),
    path('complete/',               MarkLessonCompleteView.as_view(), name='progress-complete'),
    path('course/<int:course_id>/', CourseProgressView.as_view(),    name='progress-course'),
]
