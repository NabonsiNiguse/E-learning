from rest_framework import serializers
from .models import AttendanceRecord
from users.serializers import UserListSerializer
from courses.serializers import CourseOfferingSerializer


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_detail  = UserListSerializer(source='student', read_only=True)
    marked_by_name  = serializers.SerializerMethodField()
    course_title    = serializers.SerializerMethodField()
    course_offering_detail = CourseOfferingSerializer(source='course_offering', read_only=True)

    class Meta:
        model  = AttendanceRecord
        fields = [
            'id', 'student', 'student_detail', 'course_offering', 'course_offering_detail', 'course_title',
            'marked_by', 'marked_by_name', 'date', 'status', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'marked_by', 'created_at', 'updated_at']

    def get_marked_by_name(self, obj):
        return obj.marked_by.full_name if obj.marked_by else None

    def get_course_title(self, obj):
        return obj.course_offering.course.title if obj.course_offering and obj.course_offering.course else None

    def validate(self, attrs):
        request = self.context['request']
        teacher = request.user
        course_offering = attrs.get('course_offering') or (self.instance.course_offering if self.instance else None)
        student = attrs.get('student') or (self.instance.student if self.instance else None)

        # Teacher can only mark attendance for their own course offerings
        if teacher.is_teacher and course_offering and course_offering.instructor != teacher:
            raise serializers.ValidationError(
                {'course_offering': 'You can only mark attendance for your own course offerings.'}
            )

        # Student must be enrolled in the course offering
        if student and course_offering:
            from enrollments.models import Enrollment
            enrolled = Enrollment.objects.filter(
                student=student, course_offering=course_offering, status__in=['active', 'completed']
            ).exists()
            if not enrolled:
                raise serializers.ValidationError(
                    {'student': 'This student is not enrolled in the selected course offering.'}
                )

        return attrs

    def create(self, validated_data):
        validated_data['marked_by'] = self.context['request'].user
        return super().create(validated_data)


class BulkAttendanceSerializer(serializers.Serializer):
    """Mark attendance for multiple students at once (one session)."""
    course_offering = serializers.IntegerField()
    date    = serializers.DateField()
    records = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )

    def validate_records(self, records):
        valid_statuses = {s.value for s in AttendanceRecord.Status}
        for r in records:
            if 'student' not in r:
                raise serializers.ValidationError('Each record must include a student id.')
            if 'status' not in r or r['status'] not in valid_statuses:
                raise serializers.ValidationError(
                    f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )
        return records


class AttendanceSummarySerializer(serializers.Serializer):
    """Per-student summary for a course."""
    student_id    = serializers.IntegerField()
    student_name  = serializers.CharField()
    student_email = serializers.CharField()
    total         = serializers.IntegerField()
    present       = serializers.IntegerField()
    absent        = serializers.IntegerField()
    late          = serializers.IntegerField()
    excused       = serializers.IntegerField()
    percentage    = serializers.FloatField()
