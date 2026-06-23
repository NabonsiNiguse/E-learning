from django.utils import timezone
from rest_framework import serializers
from .models import Enrollment
from courses.serializers import CourseOfferingSerializer
from users.serializers import UserListSerializer


class EnrollmentSerializer(serializers.ModelSerializer):
    course_offering_detail = CourseOfferingSerializer(source='course_offering', read_only=True)
    student_detail = UserListSerializer(source='student', read_only=True)

    class Meta:
        model  = Enrollment
        fields = [
            'id', 'student', 'student_detail', 'course_offering', 'course_offering_detail',
            'status', 'enrolled_at', 'updated_at', 'completed_at',
        ]
        read_only_fields = ['id', 'status', 'enrolled_at', 'updated_at', 'completed_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and not (request.user.is_super_admin or request.user.is_admin_only):
            self.fields['student'].read_only = True

    def validate(self, attrs):
        request = self.context['request']
        user    = request.user

        student = attrs.get('student') if (user.is_super_admin or user.is_admin_only) else user

        if not student.is_student:
            raise serializers.ValidationError(
                {'student': 'Only users with the student role can be enrolled.'}
            )

        offering = attrs['course_offering']

        if offering.course.status != 'published':
            raise serializers.ValidationError(
                {'course_offering': 'Enrollment is only allowed for published courses.'}
            )

        if Enrollment.objects.filter(student=student, course_offering=offering).exists():
            raise serializers.ValidationError(
                'This student is already enrolled in this course offering.'
            )

        # Capacity check
        current_enrolled = Enrollment.objects.filter(course_offering=offering, status='active').count()
        if current_enrolled >= offering.max_capacity:
            raise serializers.ValidationError(
                {'course_offering': 'This course offering is at full capacity.'}
            )

        # Registration window check
        semester = offering.semester
        if semester.registration_start and semester.registration_end:
            now = timezone.now()
            if not (semester.registration_start <= now <= semester.registration_end):
                raise serializers.ValidationError(
                    'The registration window for this semester is closed.'
                )

        attrs['status']  = Enrollment.Status.LOCKED if offering.course.is_premium else Enrollment.Status.ACTIVE
        attrs['student'] = student
        return attrs


class EnrollmentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Enrollment
        fields = ['status']
