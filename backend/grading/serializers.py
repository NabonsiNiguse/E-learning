from rest_framework import serializers
from .models import GradeCorrection
from users.serializers import UserListSerializer


class GradeCorrectionSerializer(serializers.ModelSerializer):
    corrected_by_detail = UserListSerializer(source='corrected_by', read_only=True)
    student_detail      = UserListSerializer(source='student', read_only=True)

    class Meta:
        model  = GradeCorrection
        fields = [
            'id', 'submission_id', 'assignment_id',
            'student', 'student_detail',
            'corrected_by', 'corrected_by_detail', 'corrected_by_role',
            'old_score', 'new_score', 'reason', 'created_at',
        ]
        read_only_fields = ['id', 'corrected_by', 'corrected_by_role', 'created_at',
                            'corrected_by_detail', 'student_detail']

    def validate_reason(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('A reason is required for grade corrections.')
        return value.strip()
