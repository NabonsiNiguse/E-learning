from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Enrollment
from .serializers import EnrollmentSerializer, EnrollmentStatusSerializer
from users.permissions import IsAdmin, IsStudent


class EnrollmentListCreateView(generics.ListCreateAPIView):
    """
    GET  — students see own enrollments; admins/teachers see all
    POST — students enroll themselves; admins can enroll anyone
    """
    serializer_class = EnrollmentSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'course']
    ordering_fields  = ['enrolled_at']

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs   = Enrollment.objects.select_related('student', 'course', 'course__teacher')
        if user.is_admin:
            return qs
        if user.is_teacher:
            return qs.filter(course__teacher=user)
        return qs.filter(student=user)

    def create(self, request, *args, **kwargs):
        # Students can only enroll themselves — enforced in serializer
        if request.user.is_teacher:
            return Response(
                {'success': False, 'message': 'Teachers cannot enroll in courses.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        return Response({
            'success': True,
            'message': 'Enrolled successfully.' if enrollment.status == 'active'
                       else 'Enrolled. Payment required to unlock course.',
            'enrollment': EnrollmentSerializer(enrollment).data,
        }, status=status.HTTP_201_CREATED)


class EnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: update enrollment status or remove enrollment."""
    permission_classes = [IsAdmin]
    queryset = Enrollment.objects.select_related('student', 'course')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return EnrollmentStatusSerializer
        return EnrollmentSerializer

    def destroy(self, request, *args, **kwargs):
        enrollment = self.get_object()
        enrollment.delete()
        return Response({'success': True, 'message': 'Enrollment removed.'})


class CompleteEnrollmentView(APIView):
    """Student marks a course as completed (only if all published lessons are done)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_student:
            return Response(
                {'success': False, 'message': 'Only students can complete enrollments.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            enrollment = Enrollment.objects.get(pk=pk, student=request.user)
        except Enrollment.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Enrollment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if enrollment.status != Enrollment.Status.ACTIVE:
            return Response(
                {'success': False, 'message': 'Only active enrollments can be completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Verify all published lessons are completed
        from courses.models import Lesson
        from progress.models import Progress
        total_lessons = Lesson.objects.filter(
            course=enrollment.course, status='published'
        ).count()
        completed_lessons = Progress.objects.filter(
            student=request.user,
            lesson__course=enrollment.course,
            completed=True,
        ).count()
        if total_lessons > 0 and completed_lessons < total_lessons:
            return Response(
                {
                    'success': False,
                    'message': f'Complete all lessons first ({completed_lessons}/{total_lessons} done).',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        enrollment.status       = Enrollment.Status.COMPLETED
        enrollment.completed_at = timezone.now()
        enrollment.save()
        return Response({'success': True, 'message': 'Course marked as completed.'})
