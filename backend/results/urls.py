from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResultsViewSet, GradingScaleViewSet, GradeAppealViewSet

router = DefaultRouter()
router.register(r'grading-scales', GradingScaleViewSet, basename='grading-scales')
router.register(r'appeals', GradeAppealViewSet, basename='appeals')
router.register(r'', ResultsViewSet, basename='results')

urlpatterns = [
    path('', include(router.urls)),
]
