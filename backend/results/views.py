from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from .models import Grade, AssessmentTemplate, AssessmentScore, GradingScale, GradeAppeal, AcademicAuditLog
from .serializers import (
    GradeSerializer,
    GradeWriteSerializer,
    AssessmentTemplateSerializer,
    AssessmentScoreSerializer,
    AssessmentScoreWriteSerializer,
    GradingScaleSerializer,
    GradingScaleWriteSerializer,
    GradeAppealSerializer,
    AuditLogSerializer,
    ConcurrencyConflictException,
)
from enrollments.models import Enrollment


def recalculate_final_grade(enrollment, user, ip_address=None):
    """
    Computes final grade as weighted sum of assessment scores.
    Must be run inside a transaction.
    """
    scores = AssessmentScore.objects.filter(enrollment=enrollment)
    total_score = 0
    total_weight = 0
    for s in scores:
        if s.score_obtained is not None and s.template.max_score > 0:
            weight = s.template.weight_percentage
            obtained = s.score_obtained
            max_s = s.template.max_score
            total_score += (obtained / max_s) * weight
            total_weight += weight

    grade, created = Grade.objects.get_or_create(
        enrollment=enrollment,
        defaults={'raw_total_score': total_score, 'status': Grade.Status.DRAFT, 'version': 1}
    )
    if not created:
        old_val = {'raw_total_score': str(grade.raw_total_score)}
        grade.raw_total_score = total_score
        grade.version += 1
        grade.save()

        # Log automatically recalculated grade
        AcademicAuditLog.objects.create(
            table_name='grades',
            record_id=grade.id,
            action='UPDATE',
            old_value=old_val,
            new_value={'raw_total_score': str(grade.raw_total_score), 'version': grade.version},
            changed_by=user,
            ip_address=ip_address
        )
    else:
        AcademicAuditLog.objects.create(
            table_name='grades',
            record_id=grade.id,
            action='INSERT',
            new_value={'raw_total_score': str(grade.raw_total_score), 'status': grade.status, 'version': grade.version},
            changed_by=user,
            ip_address=ip_address
        )


class ResultsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing final Grades.
    """
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status']
    ordering_fields = ['updated_at']
    ordering = ['-updated_at']

    def get_queryset(self):
        user = self.request.user
        qs = Grade.objects.select_related(
            'enrollment__student',
            'enrollment__course_offering__course',
            'enrollment__course_offering__semester'
        )
        if user.is_super_admin or user.is_admin_only:
            return qs
        elif user.is_dean:
            return qs.filter(enrollment__course_offering__course__department__faculty__dean=user)
        elif user.is_dept_head:
            return qs.filter(enrollment__course_offering__course__department__head=user)
        elif user.is_teacher:
            return qs.filter(enrollment__course_offering__instructor=user)
        elif user.is_student:
            # Students only see RELEASED grades
            return qs.filter(enrollment__student=user, status=Grade.Status.RELEASED)
        return Grade.objects.none()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return GradeWriteSerializer
        return GradeSerializer

    def update(self, request, *args, **kwargs):
        user = request.user
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Check permissions
        if user.is_teacher:
            if instance.enrollment.course_offering.instructor != user:
                raise PermissionDenied("You are not the instructor for this course offering.")
            if instance.is_locked:
                raise PermissionDenied("This grade is locked. Contact department head/admin to unlock.")
        elif not (user.is_super_admin or user.is_admin_only or user.is_dept_head or user.is_dean):
            raise PermissionDenied("You do not have permission to edit grades.")

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        current_version = serializer.validated_data.get('version')
        raw_total_score = serializer.validated_data.get('raw_total_score')
        status_val = serializer.validated_data.get('status')

        with transaction.atomic():
            # Refetch with select_for_update to guarantee isolation
            grade = Grade.objects.select_for_update().get(pk=instance.pk)
            if grade.version != current_version:
                raise ConcurrencyConflictException("This grade record has been updated elsewhere.")

            old_val = {
                'raw_total_score': str(grade.raw_total_score) if grade.raw_total_score else None,
                'status': grade.status,
                'version': grade.version
            }

            if raw_total_score is not None:
                grade.raw_total_score = raw_total_score
            if status_val is not None:
                grade.status = status_val

            grade.version += 1
            grade.save()

            AcademicAuditLog.objects.create(
                table_name='grades',
                record_id=grade.id,
                action='UPDATE',
                old_value=old_val,
                new_value={
                    'raw_total_score': str(grade.raw_total_score) if grade.raw_total_score else None,
                    'status': grade.status,
                    'version': grade.version
                },
                changed_by=user,
            )

        return Response(GradeSerializer(grade).data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Teacher locks the grade."""
        grade = self.get_object()
        user = request.user
        if not user.is_teacher:
            raise PermissionDenied("Only teachers can submit/lock grades.")
        if grade.enrollment.course_offering.instructor != user:
            raise PermissionDenied("You are not the instructor for this course offering.")
        if grade.raw_total_score is None:
            raise ValidationError("Grade score must be entered before submitting.")

        with transaction.atomic():
            grade = Grade.objects.select_for_update().get(pk=grade.pk)
            old_status = grade.status
            grade.status = Grade.Status.LOCKED
            grade.version += 1
            grade.save()

            AcademicAuditLog.objects.create(
                table_name='grades',
                record_id=grade.id,
                action='UPDATE',
                old_value={'status': old_status, 'version': grade.version - 1},
                new_value={'status': grade.status, 'version': grade.version},
                changed_by=user
            )

        return Response(GradeSerializer(grade).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Department Head or Admin releases/approves grade."""
        grade = self.get_object()
        user = request.user

        # Enforce Head/Admin permission
        is_allowed = False
        if user.is_super_admin or user.is_admin_only:
            is_allowed = True
        elif user.is_dept_head:
            if grade.enrollment.course_offering.course.department.head == user:
                is_allowed = True
        elif user.is_dean:
            if grade.enrollment.course_offering.course.department.faculty.dean == user:
                is_allowed = True

        if not is_allowed:
            raise PermissionDenied("Only Department Head, Dean, or Admin can release grades.")

        with transaction.atomic():
            grade = Grade.objects.select_for_update().get(pk=grade.pk)
            old_status = grade.status
            grade.status = Grade.Status.RELEASED
            grade.version += 1
            grade.save()

            AcademicAuditLog.objects.create(
                table_name='grades',
                record_id=grade.id,
                action='UPDATE',
                old_value={'status': old_status, 'version': grade.version - 1},
                new_value={'status': grade.status, 'version': grade.version},
                changed_by=user
            )

        return Response(GradeSerializer(grade).data)

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        """Admin unlocks grade for corrections."""
        grade = self.get_object()
        user = request.user
        if not (user.is_super_admin or user.is_admin_only):
            raise PermissionDenied("Only Admins can unlock grades.")

        with transaction.atomic():
            grade = Grade.objects.select_for_update().get(pk=grade.pk)
            old_status = grade.status
            grade.status = Grade.Status.DRAFT
            grade.version += 1
            grade.save()

            AcademicAuditLog.objects.create(
                table_name='grades',
                record_id=grade.id,
                action='UPDATE',
                old_value={'status': old_status, 'version': grade.version - 1},
                new_value={'status': grade.status, 'version': grade.version},
                changed_by=user
            )

        return Response(GradeSerializer(grade).data)

    @action(detail=False, methods=['get'], url_path='audit_log')
    def audit_log(self, request):
        user = request.user
        if not (user.is_super_admin or user.is_admin_only or user.is_dept_head or user.is_dean):
            raise PermissionDenied("Permission denied to view audit logs.")
        record_id = request.query_params.get('record_id')
        table_name = request.query_params.get('table_name', 'grades')
        if not record_id:
            raise ValidationError("record_id parameter is required.")
        logs = AcademicAuditLog.objects.filter(table_name=table_name, record_id=record_id)
        return Response(AuditLogSerializer(logs, many=True).data)


class AssessmentTemplateViewSet(viewsets.ModelViewSet):
    queryset = AssessmentTemplate.objects.all()
    serializer_class = AssessmentTemplateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        offering = serializer.validated_data.get('course_offering')

        is_allowed = False
        if user.is_super_admin or user.is_admin_only:
            is_allowed = True
        elif user.is_dept_head:
            if offering.course.department.head == user:
                is_allowed = True

        if not is_allowed:
            raise PermissionDenied("Only Admin or Department Head can manage assessment templates.")

        serializer.save()


class AssessmentScoreViewSet(viewsets.ModelViewSet):
    queryset = AssessmentScore.objects.all()
    serializer_class = AssessmentScoreSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AssessmentScore.objects.select_related(
            'enrollment__student',
            'template__course_offering__course'
        )
        if user.is_super_admin or user.is_admin_only:
            return qs
        elif user.is_dean:
            return qs.filter(enrollment__course_offering__course__department__faculty__dean=user)
        elif user.is_dept_head:
            return qs.filter(enrollment__course_offering__course__department__head=user)
        elif user.is_teacher:
            return qs.filter(enrollment__course_offering__instructor=user)
        elif user.is_student:
            return qs.filter(enrollment__student=user)
        return AssessmentScore.objects.none()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AssessmentScoreWriteSerializer
        return AssessmentScoreSerializer

    def update(self, request, *args, **kwargs):
        user = request.user
        partial = kwargs.pop('partial', False)

        # Permission check BEFORE get_object() so teachers who aren't
        # assigned to this offering receive 403 instead of 404.
        pk = kwargs.get('pk')
        try:
            raw_instance = AssessmentScore.objects.select_related(
                'enrollment__course_offering', 'enrollment__grade'
            ).get(pk=pk)
        except AssessmentScore.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound()

        if user.is_teacher:
            if raw_instance.enrollment.course_offering.instructor != user:
                raise PermissionDenied("You are not the instructor for this course offering.")
            # Check if final grade is already locked/released
            try:
                grade = raw_instance.enrollment.grade
                if grade.is_locked:
                    raise PermissionDenied("Final grade is locked. Contact head/admin to unlock.")
            except Grade.DoesNotExist:
                pass
        elif not (user.is_super_admin or user.is_admin_only):
            raise PermissionDenied("You do not have permission to update scores.")

        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        current_version = serializer.validated_data.get('version')
        score_obtained = serializer.validated_data.get('score_obtained')

        with transaction.atomic():
            score = AssessmentScore.objects.select_for_update().get(pk=instance.pk)
            if score.version != current_version:
                raise ConcurrencyConflictException("This assessment score has been updated elsewhere.")

            old_val = {
                'score_obtained': str(score.score_obtained) if score.score_obtained else None,
                'version': score.version
            }

            if score_obtained is not None:
                score.score_obtained = score_obtained
            score.version += 1
            score.graded_by = user
            score.graded_at = timezone.now()
            score.save()

            AcademicAuditLog.objects.create(
                table_name='assessment_scores',
                record_id=score.id,
                action='UPDATE',
                old_value=old_val,
                new_value={
                    'score_obtained': str(score.score_obtained) if score.score_obtained else None,
                    'version': score.version
                },
                changed_by=user,
            )

            # Auto-recalculate Grade
            recalculate_final_grade(score.enrollment, user)

        return Response(AssessmentScoreSerializer(score).data)


class GradingScaleViewSet(viewsets.ModelViewSet):
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
    serializer_class = GradeAppealSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin or user.is_admin_only:
            return GradeAppeal.objects.all()
        elif user.is_teacher:
            return GradeAppeal.objects.filter(grade__enrollment__course_offering__instructor=user)
        elif user.is_student:
            return GradeAppeal.objects.filter(student=user)
        return GradeAppeal.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.is_student:
            raise PermissionDenied('Only students can create appeals.')
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Student registers appeal against their Grade
        grade_id = self.request.data.get('grade')
        try:
            grade = Grade.objects.get(pk=grade_id, enrollment__student=self.request.user)
        except Grade.DoesNotExist:
            raise ValidationError("Grade record not found or does not belong to you.")
        serializer.save(student=self.request.user, grade=grade)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        appeal = self.get_object()
        user = request.user
        if not user.is_teacher:
            raise PermissionDenied('Only teachers can review appeals.')
        if appeal.grade.enrollment.course_offering.instructor != user:
            raise PermissionDenied('Not your course offering.')

        appeal.teacher_response = request.data.get('teacher_response', '')
        appeal.teacher_reviewed_by = user
        appeal.teacher_reviewed_at = timezone.now()
        appeal.status = GradeAppeal.Status.REVIEWED
        appeal.save()

        return Response(GradeAppealSerializer(appeal).data)

    @action(detail=True, methods=['post'])
    def override(self, request, pk=None):
        appeal = self.get_object()
        user = request.user
        if not (user.is_super_admin or user.is_admin_only):
            raise PermissionDenied('Only admin can override grades.')

        override_score = request.data.get('override_score')
        if override_score is None:
            raise ValidationError('override_score is required.')

        with transaction.atomic():
            # Lock Grade
            grade = Grade.objects.select_for_update().get(pk=appeal.grade.pk)
            old_score = grade.raw_total_score
            grade.raw_total_score = override_score
            grade.version += 1
            grade.save()

            appeal.override_score = override_score
            appeal.override_reason = request.data.get('override_reason', '')
            appeal.override_by = user
            appeal.override_at = timezone.now()
            appeal.status = GradeAppeal.Status.APPROVED
            appeal.save()

            AcademicAuditLog.objects.create(
                table_name='grades',
                record_id=grade.id,
                action='UPDATE',
                old_value={'raw_total_score': str(old_score), 'version': grade.version - 1},
                new_value={'raw_total_score': str(grade.raw_total_score), 'version': grade.version},
                changed_by=user,
                note=f'Override via appeal#{appeal.id}'
            )

        return Response(GradeAppealSerializer(appeal).data)
