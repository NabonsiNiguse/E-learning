"""
Results serializers — STRICT role-based field exposure.

Key rules:
  - Teachers: ONLY see student name, course, assignment/quiz/attendance/progress scores
  - Teachers: NEVER see final score, grade, GPA, or status
  - Students: ONLY see their own data with final score, grade, GPA, pass/fail
  - Admin: FULL data including all scores, grades, GPA, status
  - Score validated 0–100 on write.
  - Grades NEVER stored, always computed in backend.
"""
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from .models import StudentResult, GradingScale, GradingRule, GradeAppeal, ResultAuditLog
from users.serializers import UserListSerializer


# ---------------------------------------------------------------------------
# Grading Scale
# ---------------------------------------------------------------------------
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
    """Used for create/update — accepts rules as nested input."""
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


# ---------------------------------------------------------------------------
# Audit Log
# ---------------------------------------------------------------------------
class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_detail = UserListSerializer(source='performed_by', read_only=True)

    class Meta:
        model  = ResultAuditLog
        fields = [
            'id', 'action', 'performed_by', 'performed_by_detail',
            'performed_by_role', 'old_value', 'new_value', 'note', 'timestamp',
        ]


# ---------------------------------------------------------------------------
# TEACHER SERIALIZER — STRICT: Only student name, course, component scores
# ---------------------------------------------------------------------------
class TeacherResultSerializer(serializers.ModelSerializer):
    """
    TEACHER VIEW: Minimal data for score entry.
    - Student name only
    - Course title only
    - Raw score (editable)
    - NO grade, NO GPA, NO final score, NO status
    """
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model  = StudentResult
        fields = [
            'id',
            'student_name',
            'course_title',
            'year', 'semester',
            'raw_score',  # Editable
            'status',
        ]
        read_only_fields = ['id', 'student_name', 'course_title', 'year', 'semester', 'status']


class TeacherScoreWriteSerializer(serializers.ModelSerializer):
    """
    Teachers can ONLY set raw_score.
    Grade, GPA, pass_fail are computed — not accepted as input.
    """
    class Meta:
        model  = StudentResult
        fields = ['raw_score']

    def validate_raw_score(self, value):
        if value is None:
            return value
        if not (0 <= float(value) <= 100):
            raise serializers.ValidationError('Score must be between 0 and 100.')
        return value

    def validate(self, attrs):
        return attrs


# ---------------------------------------------------------------------------
# STUDENT SERIALIZER — STRICT: Only own data with final score, grade, GPA
# ---------------------------------------------------------------------------
class StudentResultSerializer(serializers.ModelSerializer):
    """
    STUDENT VIEW: Own results only with computed grades.
    - Course title
    - Final score (raw_score)
    - Grade letter (computed)
    - GPA (computed)
    - Pass/fail (computed)
    - NO status, NO submission details
    """
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_teacher = serializers.CharField(source='course.teacher.full_name', read_only=True)

    # Computed from GradingScale — never stored
    grade_letter = serializers.SerializerMethodField()
    gpa = serializers.SerializerMethodField()
    pass_fail = serializers.SerializerMethodField()

    class Meta:
        model  = StudentResult
        fields = [
            'id',
            'course_title',
            'course_teacher',
            'year', 'semester',
            'raw_score',  # Final score
            'grade_letter',
            'gpa',
            'pass_fail',
        ]
        read_only_fields = fields

    def get_grade_letter(self, obj):
        computed = obj.compute_grade()
        return computed['letter'] if computed else None

    def get_gpa(self, obj):
        computed = obj.compute_grade()
        return computed['gpa'] if computed else None

    def get_pass_fail(self, obj):
        computed = obj.compute_grade()
        return computed['pass_fail'] if computed else None


# ---------------------------------------------------------------------------
# ADMIN SERIALIZER — FULL: All data including status, audit info
# ---------------------------------------------------------------------------
class AdminResultSerializer(serializers.ModelSerializer):
    """
    ADMIN VIEW: Full data for management.
    - Student details
    - Course details
    - Raw score
    - Grade (computed)
    - GPA (computed)
    - Pass/fail (computed)
    - Status and submission details
    """
    student_detail = UserListSerializer(source='student', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_teacher = serializers.CharField(source='course.teacher.full_name', read_only=True)

    # Computed from GradingScale
    grade_letter = serializers.SerializerMethodField()
    gpa = serializers.SerializerMethodField()
    pass_fail = serializers.SerializerMethodField()

    class Meta:
        model  = StudentResult
        fields = [
            'id',
            'student', 'student_detail',
            'course', 'course_title', 'course_teacher',
            'year', 'semester',
            'raw_score',
            'grade_letter', 'gpa', 'pass_fail',
            'status',
            'submitted_at', 'submitted_by',
            'approved_at', 'approved_by',
            'unlocked_at', 'unlocked_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_grade_letter(self, obj):
        computed = obj.compute_grade()
        return computed['letter'] if computed else None

    def get_gpa(self, obj):
        computed = obj.compute_grade()
        return computed['gpa'] if computed else None

    def get_pass_fail(self, obj):
        computed = obj.compute_grade()
        return computed['pass_fail'] if computed else None


class AdminResultWriteSerializer(serializers.ModelSerializer):
    """Admin can edit raw_score and status."""
    class Meta:
        model  = StudentResult
        fields = ['raw_score', 'status']

    def validate_raw_score(self, value):
        if value is not None and not (0 <= float(value) <= 100):
            raise serializers.ValidationError('Score must be between 0 and 100.')
        return value


# ---------------------------------------------------------------------------
# Grade Appeal
# ---------------------------------------------------------------------------
class GradeAppealSerializer(serializers.ModelSerializer):
    student_detail          = UserListSerializer(source='student', read_only=True)
    teacher_reviewed_detail = UserListSerializer(source='teacher_reviewed_by', read_only=True)
    override_by_detail      = UserListSerializer(source='override_by', read_only=True)
    result_detail           = StudentResultSerializer(source='result', read_only=True)

    class Meta:
        model  = GradeAppeal
        fields = [
            'id', 'result', 'result_detail',
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
            'result_detail',
        ]
