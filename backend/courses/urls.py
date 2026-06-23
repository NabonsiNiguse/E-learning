from django.urls import path
from .views import (
    FacultyViewSet,
    DepartmentViewSet,
    AcademicSemesterViewSet,
    CourseOfferingViewSet,
    CourseListCreateView,
    CourseDetailView,
    CoursePublishView,
    LessonListCreateView,
    LessonDetailView,
)

urlpatterns = [
    # Template Course/Lesson endpoints
    path('',                                  CourseListCreateView.as_view(), name='course-list'),
    path('<int:pk>/',                         CourseDetailView.as_view(),     name='course-detail'),
    path('<int:pk>/publish/',                 CoursePublishView.as_view(),    name='course-publish'),
    path('<int:course_pk>/lessons/',          LessonListCreateView.as_view(), name='lesson-list'),
    path('<int:course_pk>/lessons/<int:pk>/', LessonDetailView.as_view(),     name='lesson-detail'),

    # Organization endpoints
    path('faculties/', FacultyViewSet.as_view({'get': 'list', 'post': 'create'}), name='faculty-list'),
    path('faculties/<int:pk>/', FacultyViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='faculty-detail'),
    
    path('departments/', DepartmentViewSet.as_view({'get': 'list', 'post': 'create'}), name='department-list'),
    path('departments/<int:pk>/', DepartmentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='department-detail'),
    
    path('semesters/', AcademicSemesterViewSet.as_view({'get': 'list', 'post': 'create'}), name='semester-list'),
    path('semesters/<int:pk>/', AcademicSemesterViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='semester-detail'),
    
    path('offerings/', CourseOfferingViewSet.as_view({'get': 'list', 'post': 'create'}), name='offering-list'),
    path('offerings/<int:pk>/', CourseOfferingViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='offering-detail'),
]
