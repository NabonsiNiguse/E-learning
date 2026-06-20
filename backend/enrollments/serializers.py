from rest_framework import serializers
from .models import Enrollment
from courses.serializers import CourseListSerializer
from users.serializers import UserListSerializer


class EnrollmentSerializer(serializers.ModelSerializer):
    course_detail  = CourseListSerializer(source='course', read_only=True)
    student_detail = UserListSerializer(source='student', read_only=True)

    class Meta:
        model  = Enrollment
        fields = [
            'id', 'student', 'student_detail', 'course', 'course_detail',
            'status', 'enrolled_at', 'updated_at', 'completed_at',
        ]
        read_only_fields = ['id', 'status', 'enrolled_at', 'updated_at', 'completed_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        # Students cannot supply a student field — they always enroll themselves.
        # Only admins can specify which student to enroll.
        if request and not request.user.is_admin:
            self.fields['student'].read_only = True

    def validate(self, attrs):
        request = self.context['request']
        user    = request.user

        # Resolve the student: admin can pass one, everyone else enrolls themselves
        student = attrs.get('student') if user.is_admin else user

        # Role guard: only users with role=student can be enrolled
        if not student.is_student:
            raise serializers.ValidationError(
                {'student': 'Only users with the student role can be enrolled in a course.'}
            )

        course = attrs['course']

        # Course must be published before anyone can enroll
        if course.status != 'published':
            raise serializers.ValidationError(
                {'course': 'Enrollment is only allowed for published courses.'}
            )

        # Prevent duplicate enrollment
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError(
                'This student is already enrolled in this course.'
            )

        # Premium course → locked until payment clears
        attrs['status']  = Enrollment.Status.LOCKED if course.is_premium else Enrollment.Status.ACTIVE
        attrs['student'] = student
        return attrs

    def create(self, validated_data):
        return super().create(validated_data)


class EnrollmentStatusSerializer(serializers.ModelSerializer):
    """Admin-only: manually update enrollment status."""
    class Meta:
        model  = Enrollment
        fields = ['status']
