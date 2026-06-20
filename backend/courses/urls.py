from django.urls import path
from .views import (
    CourseListCreateView,
    CourseDetailView,
    CoursePublishView,
    LessonListCreateView,
    LessonDetailView,
)

urlpatterns = [
    path('',                                  CourseListCreateView.as_view(), name='course-list'),
    path('<int:pk>/',                         CourseDetailView.as_view(),     name='course-detail'),
    path('<int:pk>/publish/',                 CoursePublishView.as_view(),    name='course-publish'),
    path('<int:course_pk>/lessons/',          LessonListCreateView.as_view(), name='lesson-list'),
    path('<int:course_pk>/lessons/<int:pk>/', LessonDetailView.as_view(),     name='lesson-detail'),
]
