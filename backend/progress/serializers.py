from rest_framework import serializers
from .models import Progress
from courses.serializers import LessonListSerializer


class ProgressSerializer(serializers.ModelSerializer):
    lesson_detail = LessonListSerializer(source='lesson', read_only=True)

    class Meta:
        model  = Progress
        fields = [
            'id', 'student', 'lesson', 'lesson_detail',
            'completed', 'completed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'student', 'completed_at', 'created_at', 'updated_at']

    def validate(self, attrs):
        request = self.context['request']
        lesson  = attrs['lesson']
        student = request.user

        # Ensure student is enrolled in the course (active or completed)
        from enrollments.models import Enrollment
        enrolled = Enrollment.objects.filter(
            student=student,
            course=lesson.course,
            status__in=['active', 'completed'],
        ).exists()
        if not enrolled:
            raise serializers.ValidationError(
                'You must be enrolled in this course to track progress.'
            )
        return attrs
