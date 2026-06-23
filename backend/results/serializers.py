from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, APIException
from rest_framework import status
from django.db import transaction
from .models import Grade, AssessmentTemplate, AssessmentScore, GradingScale, GradingRule, GradeAppeal, AcademicAuditLog
from users.serializers import UserListSerializer


class ConcurrencyConflictException(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'This record was modified by another user. Please reload and try again.'
    default_code = 'concurrency_conflict'


class GradingRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = GradingRule
        fields = ['id', 'letter', 'min_score', 'max_score', 'gpa_points', 'pass_fail']


class GradingScaleSerializer(serializers.ModelSerializer):
    rules      = GradingRuleSerializer(many=True, read_only=True)
    created_by = UserListSerializer(read_only=True)

    class Meta:
        model  = GradingScale
        fields = ['id', 'name', 'is_active', 'rules', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class GradingScaleWriteSerializer(serializers.ModelSerializer):
    rules = GradingRuleSerializer(many=True)

    class Meta:
        model  = GradingScale
        fields = ['id', 'name', 'is_active', 'rules']

    def validate_rules(self, rules):
        if not rules:
            raise serializers.ValidationError('At least one grading rule is required.')
        sorted_rules = sorted(rules, key=lambda r: float(r['min_score']))
        for i, rule in enumerate(sorted_rules):
            if float(rule['min_score']) > float(rule['max_score']):
                raise serializers.ValidationError(
                    f"Rule {rule['letter']}: min_score must be ≤ max_score."
                )
        return rules

    def create(self, validated_data):
        rules_data = validated_data.pop('rules')
        scale = GradingScale.objects.create(**validated_data)
        for rule in rules_data:
            GradingRule.objects.create(scale=scale, **rule)
        return scale

    def update(self, instance, validated_data):
        rules_data = validated_data.pop('rules', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if rules_data is not None:
            instance.rules.all().delete()
            for rule in rules_data:
                GradingRule.objects.create(scale=instance, **rule)
        return instance


class AssessmentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentTemplate
        fields = ['id', 'course_offering', 'name', 'max_score', 'weight_percentage']


class AssessmentScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='enrollment.student.full_name', read_only=True)
    student_email = serializers.CharField(source='enrollment.student.email', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)

    class Meta:
        model = AssessmentScore
        fields = [
            'id', 'enrollment', 'student_name', 'student_email',
            'template', 'template_name', 'score_obtained', 'version',
            'graded_by', 'graded_at'
        ]
        read_only_fields = ['id', 'enrollment', 'student_name', 'student_email', 'template', 'template_name', 'graded_by', 'graded_at']


class AssessmentScoreWriteSerializer(serializers.ModelSerializer):
    version = serializers.IntegerField(required=True)

    class Meta:
        model = AssessmentScore
        fields = ['score_obtained', 'version']

    def validate_score_obtained(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Score obtained cannot be negative.")
        return value


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='enrollment.student.full_name', read_only=True)
    student_email = serializers.CharField(source='enrollment.student.email', read_only=True)
    course_title = serializers.CharField(source='enrollment.course_offering.course.title', read_only=True)
    semester = serializers.CharField(source='enrollment.course_offering.semester', read_only=True)

    # Computed fields
    grade_letter = serializers.CharField(read_only=True)
    gpa_points = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    pass_fail = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            'id', 'enrollment', 'student_name', 'student_email',
            'course_title', 'semester', 'raw_total_score', 'grade_letter',
            'gpa_points', 'pass_fail', 'status', 'version', 'updated_at'
        ]
        read_only_fields = [
            'id', 'enrollment', 'student_name', 'student_email',
            'course_title', 'semester', 'grade_letter', 'gpa_points',
            'pass_fail', 'status', 'version', 'updated_at'
        ]

    def get_pass_fail(self, obj):
        computed = obj.compute_grade()
        return computed['pass_fail'] if computed else None


class GradeWriteSerializer(serializers.ModelSerializer):
    version = serializers.IntegerField(required=True)

    class Meta:
        model = Grade
        fields = ['raw_total_score', 'status', 'version']

    def validate_raw_score(self, value):
        if value is not None and not (0 <= float(value) <= 100):
            raise serializers.ValidationError('Score must be between 0 and 100.')
        return value


class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_detail = UserListSerializer(source='changed_by', read_only=True)

    class Meta:
        model  = AcademicAuditLog
        fields = [
            'id', 'table_name', 'record_id', 'action',
            'old_value', 'new_value', 'changed_by', 'performed_by_detail',
            'ip_address', 'timestamp'
        ]


class GradeAppealSerializer(serializers.ModelSerializer):
    student_detail          = UserListSerializer(source='student', read_only=True)
    teacher_reviewed_detail = UserListSerializer(source='teacher_reviewed_by', read_only=True)
    override_by_detail      = UserListSerializer(source='override_by', read_only=True)
    grade_detail            = GradeSerializer(source='grade', read_only=True)

    class Meta:
        model  = GradeAppeal
        fields = [
            'id', 'grade', 'grade_detail',
            'student', 'student_detail',
            'reason', 'status',
            'teacher_response', 'teacher_reviewed_by', 'teacher_reviewed_detail',
            'teacher_reviewed_at',
            'override_score', 'override_reason',
            'override_by', 'override_by_detail', 'override_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'status',
            'teacher_reviewed_by', 'teacher_reviewed_at',
            'override_by', 'override_at',
            'created_at', 'updated_at',
            'student_detail', 'teacher_reviewed_detail', 'override_by_detail',
            'grade_detail',
        ]
