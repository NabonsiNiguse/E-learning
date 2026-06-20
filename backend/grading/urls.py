from django.urls import path
from .views import GradeCorrectionListCreateView

urlpatterns = [
    path('corrections/', GradeCorrectionListCreateView.as_view(), name='grade-corrections'),
]
