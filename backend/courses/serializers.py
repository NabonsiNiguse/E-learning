from rest_framework import serializers
from django.utils.text import slugify
from .models import Course, Lesson


# ---------------------------------------------------------------------------
# Lesson serializers
# ---------------------------------------------------------------------------

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Lesson
        fields = [
            'id', 'course', 'title', 'description', 'video_url',
            'file_url', 'order', 'status', 'duration_min',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_course(self, course):
        """Teacher can only add lessons to their own courses."""
        request = self.context.get('request')
        if request and request.user.is_teacher:
            if course.teacher != request.user:
                raise serializers.ValidationError('You do not own this course.')
        return course


class LessonListSerializer(serializers.ModelSerializer):
    """
    Lightweight read-only serializer for list endpoints.
    Exposes video_url for enrolled students and course owners.
    """
    class Meta:
        model  = Lesson
        fields = ['id', 'title', 'order', 'status', 'duration_min', 'video_url', 'file_url']


# ---------------------------------------------------------------------------
# Course serializers
# ---------------------------------------------------------------------------

class CourseSerializer(serializers.ModelSerializer):
    lessons        = LessonListSerializer(many=True, read_only=True)
    lesson_count   = serializers.ReadOnlyField()
    enrolled_count = serializers.ReadOnlyField()
    teacher_name   = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = [
            'id', 'teacher', 'teacher_name', 'title', 'slug', 'description',
            'thumbnail', 'status', 'is_premium', 'price', 'category', 'tags',
            'lesson_count', 'enrolled_count', 'lessons',
            'created_at', 'updated_at',
        ]
        # slug is always auto-generated; teacher is set in create/locked in update
        read_only_fields = ['id', 'slug', 'teacher', 'created_at', 'updated_at']

    def get_teacher_name(self, obj):
        return obj.teacher.full_name

    # ── Validation ────────────────────────────────────────────────────────

    def validate_status(self, value):
        """
        Status transitions must go through the dedicated publish endpoint.
        Direct PATCH of status is blocked here to prevent bypassing publish rules.
        """
        if self.instance and value != self.instance.status:
            raise serializers.ValidationError(
                'Use the publish/unpublish endpoint to change course status.'
            )
        return value

    # ── Create ────────────────────────────────────────────────────────────

    def create(self, validated_data):
        request = self.context['request']

        if request.user.is_teacher:
            # Teachers always own the course they create
            validated_data['teacher'] = request.user
        elif request.user.is_admin:
            # Admin must supply a teacher in the request body
            if 'teacher' not in validated_data:
                raise serializers.ValidationError(
                    {'teacher': 'Admin must specify a teacher when creating a course.'}
                )
            if not validated_data['teacher'].is_teacher:
                raise serializers.ValidationError(
                    {'teacher': 'Assigned user must have the teacher role.'}
                )

        validated_data['created_by'] = request.user
        # New courses always start as DRAFT regardless of what was submitted
        validated_data['status'] = Course.Status.DRAFT

        validated_data['slug'] = self._unique_slug(validated_data['title'])
        return super().create(validated_data)

    # ── Update ────────────────────────────────────────────────────────────

    def update(self, instance, validated_data):
        # Prevent reassigning the teacher via a PATCH
        validated_data.pop('teacher', None)

        if 'title' in validated_data and validated_data['title'] != instance.title:
            validated_data['slug'] = self._unique_slug(
                validated_data['title'], exclude_pk=instance.pk
            )
        return super().update(instance, validated_data)

    # ── Helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def _unique_slug(title, exclude_pk=None):
        base_slug = slugify(title)
        slug, n   = base_slug, 1
        qs = Course.objects.all()
        if exclude_pk:
            qs = qs.exclude(pk=exclude_pk)
        while qs.filter(slug=slug).exists():
            slug = f'{base_slug}-{n}'
            n   += 1
        return slug


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight read-only serializer for list endpoints."""
    lesson_count   = serializers.ReadOnlyField()
    enrolled_count = serializers.ReadOnlyField()
    teacher_name   = serializers.SerializerMethodField()
    thumbnail      = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = [
            'id', 'title', 'slug', 'teacher_name', 'thumbnail',
            'status', 'is_premium', 'price', 'category',
            'lesson_count', 'enrolled_count', 'created_at',
        ]

    def get_teacher_name(self, obj):
        return obj.teacher.full_name

    def get_thumbnail(self, obj):
        if not obj.thumbnail:
            return None
        val = str(obj.thumbnail)
        # Already an absolute URL (http/https) — return as-is
        if val.startswith('http://') or val.startswith('https://'):
            return val
        # Relative media path — build absolute URL from request
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/media/{val}')
        return f'/media/{val}'
