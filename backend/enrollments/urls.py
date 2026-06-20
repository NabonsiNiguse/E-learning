from django.urls import path
from .views import EnrollmentListCreateView, EnrollmentDetailView, CompleteEnrollmentView

urlpatterns = [
    path('',              EnrollmentListCreateView.as_view(), name='enrollment-list'),
    path('<int:pk>/',     EnrollmentDetailView.as_view(),     name='enrollment-detail'),
    path('<int:pk>/complete/', CompleteEnrollmentView.as_view(), name='enrollment-complete'),
]
