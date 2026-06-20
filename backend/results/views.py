"""
Results views - unified /results endpoint with role-based access control.

Architecture:
  - Single /results endpoint with role-based behavior
  - Teachers: view assigned students, enter/edit raw scores only, submit to lock
  - Students: view own results (read-only), filter by year/semester
  - Admin: full control, manage grading rules, approve/unlock results
  - All mutations logged in ResultAuditLog (immutable)
  - Grades computed automatically from GradingScale - never stored directly
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from .models import StudentResult, GradingScale, GradeAppeal, ResultAuditLog
from .serializers import (
    StudentResultSerializer,
    TeacherResultSerializer,
    AdminResultSerializer,
    TeacherScoreWriteSerializer,
    AdminResultWriteSerializer,
    GradingScaleSerializer,
    GradingScaleWriteSerializer,
    GradeAppealSerializer,
    AuditLogSerializer,
)


class ResultsViewSet(viewsets.ModelViewSet):
    """
    Unified /results endpoint with role-based access control.

    Teacher:
      - GET: list students in their courses
      - PATCH: update raw_score only (if not locked)
      - POST /submit/: lock result after entering scores

    Student:
      - GET: list own results (with year/semester filtering)
      - GET detail: view own result (read-only)

    Admin:
      - GET: list all results
      - POST: create result
      - PATCH: full control
      - POST /approve/: approve final results
      - POST /unlock/: unlock for correction
      - GET /audit-log/: view audit trail
    """
    pagination_class = None
    queryset = StudentResult.objects.all()
    serializer_class = StudentResultSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['year', 'semester', 'status']
    ordering_fields = ['year', 'semester', 'student__last_name', 'created_at']
    ordering = ['-year', 'semester', 'student__last_name']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return StudentResult.objects.all()
        elif user.is_teacher:
            # Teacher sees results for their courses only
            return StudentResult.objects.filter(course__teacher=user)
        elif user.is_student:
            # Student sees only their own results
            return StudentResult.objects.filter(student=user)
        return StudentResult.objects.none()

    def get_serializer_class(self):
        """
        STRICT role-based serializer selection.
        Each role gets a COMPLETELY DIFFERENT serializer with different fields.
        """
        user = self.request.user
        
        # WRITE operations
        if self.request.method in ['PUT', 'PATCH']:
            if user.is_admin:
                return AdminResultWriteSerializer
            elif user.is_teacher:
                return TeacherScoreWriteSerializer
            else:
                raise PermissionDenied('Students cannot edit results.')
        
        # READ operations
        if user.is_admin:
            return AdminResultSerializer
        elif user.is_teacher:
            return TeacherResultSerializer
        elif user.is_student:
            return StudentResultSerializer
        
        return StudentResultSerializer

    def create(self, request, *args, **kwargs):
        """Only admin can create results."""
        if not request.user.is_admin:
            raise PermissionDenied('Only admin can create results.')
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        result = serializer.save()
        # Log creation
        ResultAuditLog.objects.create(
            result=result,
            action=ResultAuditLog.Action.CREATED,
            performed_by=self.request.user,
            performed_by_role=self.request.user.role,
            new_value={
                'student_id': result.student_id,
                'course_id': result.course_id,
                'year': result.year,
                'semester': result.semester,
                'raw_score': str(result.raw_score) if result.raw_score else None,
            },
        )

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        # Prevent editing locked results (unless admin)
        if instance.is_locked and not user.is_admin:
            raise PermissionDenied('This result is locked. Contact admin to unlock.')

        # Teacher can only edit raw_score
        if user.is_teacher:
            if 'raw_score' in serializer.validated_data:
                old_score = instance.raw_score
                instance = serializer.save()
                ResultAuditLog.objects.create(
                    result=instance,
                    action=ResultAuditLog.Action.SCORE_SET,
                    performed_by=user,
                    performed_by_role=user.role,
                    old_value={'raw_score': str(old_score) if old_score else None},
                    new_value={'raw_score': str(instance.raw_score) if instance.raw_score else None},
                )
            else:
                raise PermissionDenied('Teachers can only edit raw_score.')
        else:
            # Admin can edit anything
            instance = serializer.save()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Teacher submits scores - locks the result."""
        result = self.get_object()
        if not request.user.is_teacher:
            raise PermissionDenied('Only teachers can submit.')
        if result.course.teacher != request.user:
            raise PermissionDenied('Not your course.')
        if result.status not in (StudentResult.Status.DRAFT, StudentResult.Status.UNLOCKED):
            return Response(
                {'error': 'Result must be in draft or unlocked state to submit.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if result.raw_score is None:
            return Response(
                {'error': 'Score required before submit.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result.status = StudentResult.Status.SUBMITTED
        result.submitted_at = timezone.now()
        result.submitted_by = request.user
        result.save()

        ResultAuditLog.objects.create(
            result=result,
            action=ResultAuditLog.Action.SUBMITTED,
            performed_by=request.user,
            performed_by_role=request.user.role,
            new_value={'status': result.status, 'submitted_at': result.submitted_at.isoformat()},
        )

        return Response(StudentResultSerializer(result).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Admin approves final results."""
        result = self.get_object()
        if not request.user.is_admin:
            raise PermissionDenied('Only admin can approve.')
        if result.status != StudentResult.Status.SUBMITTED:
            return Response(
                {'error': 'Must be submitted first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result.status = StudentResult.Status.APPROVED
        result.approved_at = timezone.now()
        result.approved_by = request.user
        result.save()

        ResultAuditLog.objects.create(
            result=result,
            action=ResultAuditLog.Action.APPROVED,
            performed_by=request.user,
            performed_by_role=request.user.role,
            new_value={'status': result.status, 'approved_at': result.approved_at.isoformat()},
        )

        return Response(StudentResultSerializer(result).data)

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        """Admin unlocks result for correction."""
        result = self.get_object()
        if not request.user.is_admin:
            raise PermissionDenied('Only admin can unlock.')

        old_status = result.status
        result.status = StudentResult.Status.UNLOCKED
        result.unlocked_at = timezone.now()
        result.unlocked_by = request.user
        result.save()

        ResultAuditLog.objects.create(
            result=result,
            action=ResultAuditLog.Action.UNLOCKED,
            performed_by=request.user,
            performed_by_role=request.user.role,
            old_value={'status': old_status},
            new_value={'status': result.status, 'unlocked_at': result.unlocked_at.isoformat()},
        )

        return Response(StudentResultSerializer(result).data)

    @action(detail=False, methods=['get'], url_path='audit_log')
    def audit_log(self, request):
        """Get audit log for a result (admin only)."""
        if not request.user.is_admin:
            raise PermissionDenied('Admin only.')
        result_id = request.query_params.get('result_id')
        if not result_id:
            return Response(
                {'error': 'result_id required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        logs = ResultAuditLog.objects.filter(result_id=result_id)
        return Response(AuditLogSerializer(logs, many=True).data)


class GradingScaleViewSet(viewsets.ModelViewSet):
    """Admin manages grading scales."""
    pagination_class = None
    queryset = GradingScale.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return GradingScaleWriteSerializer
        return GradingScaleSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.is_admin:
            raise PermissionDenied('Only admin can create grading scales.')
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        if not request.user.is_admin:
            raise PermissionDenied('Only admin can update grading scales.')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_admin:
            raise PermissionDenied('Only admin can delete grading scales.')
        return super().destroy(request, *args, **kwargs)


class GradeAppealViewSet(viewsets.ModelViewSet):
    """
    Students create appeals; teachers and admin review/override.
    """
    pagination_class = None
    serializer_class = GradeAppealSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return GradeAppeal.objects.all()
        elif user.is_teacher:
            # Teacher sees appeals for their courses
            return GradeAppeal.objects.filter(result__course__teacher=user)
        elif user.is_student:
            # Student sees their own appeals
            return GradeAppeal.objects.filter(student=user)
        return GradeAppeal.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.is_student:
            raise PermissionDenied('Only students can create appeals.')
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Teacher reviews appeal and provides response."""
        appeal = self.get_object()
        if not request.user.is_teacher:
            raise PermissionDenied('Only teachers can review.')
        if appeal.result.course.teacher != request.user:
            raise PermissionDenied('Not your course.')

        appeal.teacher_response = request.data.get('teacher_response', '')
        appeal.teacher_reviewed_by = request.user
        appeal.teacher_reviewed_at = timezone.now()
        appeal.status = GradeAppeal.Status.REVIEWED
        appeal.save()

        return Response(GradeAppealSerializer(appeal).data)

    @action(detail=True, methods=['post'])
    def override(self, request, pk=None):
        """Admin overrides grade via appeal."""
        appeal = self.get_object()
        if not request.user.is_admin:
            raise PermissionDenied('Only admin can override.')

        override_score = request.data.get('override_score')
        if override_score is None:
            return Response(
                {'error': 'override_score required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update result score
        result = appeal.result
        old_score = result.raw_score
        result.raw_score = override_score
        result.save()

        # Update appeal
        appeal.override_score = override_score
        appeal.override_reason = request.data.get('override_reason', '')
        appeal.override_by = request.user
        appeal.override_at = timezone.now()
        appeal.status = GradeAppeal.Status.APPROVED
        appeal.save()

        # Log the override
        ResultAuditLog.objects.create(
            result=result,
            action=ResultAuditLog.Action.SCORE_SET,
            performed_by=request.user,
            performed_by_role=request.user.role,
            old_value={'raw_score': str(old_score) if old_score else None},
            new_value={'raw_score': str(result.raw_score)},
            note=f'Override via appeal#{appeal.id}',
        )

        return Response(GradeAppealSerializer(appeal).data)
