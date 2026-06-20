"""
Grading views — grade correction audit records only.

This app now exists solely to record immutable grade corrections.
GradeAppeal is handled inside the results app, so the grading app
must not reintroduce grade_appeals or duplicate that table.
"""
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import GradeCorrection
from .serializers import GradeCorrectionSerializer
from users.permissions import IsTeacher, IsSuperAdmin


class GradeCorrectionListCreateView(generics.ListCreateAPIView):
    serializer_class = GradeCorrectionSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = GradeCorrection.objects.select_related('corrected_by', 'student')
        if user.is_super_admin or user.is_admin_only:
            return qs
        if user.is_teacher:
            return qs.filter(corrected_by=user)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_teacher or user.is_super_admin):
            raise PermissionDenied('Only teachers and the Academic Manager can correct grades.')

        assignment_id = self.request.data.get('assignment_id', '')
        if user.is_teacher and assignment_id:
            if not self._teacher_owns_assignment(user, str(assignment_id)):
                raise PermissionDenied(
                    'You can only correct grades for assignments in your own courses.'
                )

        serializer.save(
            corrected_by=user,
            corrected_by_role=user.role,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'success': True, 'data': serializer.data}, status=201)

    def _teacher_owns_assignment(self, teacher, assignment_id: str) -> bool:
        try:
            pk = int(assignment_id)
        except (ValueError, TypeError):
            return False

        try:
            from django.apps import apps
            for model in apps.get_models():
                if model.__name__ == 'Assignment':
                    try:
                        assignment = model.objects.select_related('course').get(pk=pk)
                        return assignment.course.teacher == teacher
                    except model.DoesNotExist:
                        return False
            return False
        except Exception:
            return False
