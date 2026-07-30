from rest_framework import serializers
from django.utils.text import slugify
from .models import (
    Faculty, Department, Course, AcademicSemester, CourseOffering, Lesson,
    Assignment, AssignmentSubmission, Quiz, Question, Choice, QuizSubmission, StudentAnswer,
)
from users.serializers import UserListSerializer


class FacultySerializer(serializers.ModelSerializer):
    dean_detail = UserListSerializer(source='dean', read_only=True)

    class Meta:
        model = Faculty
        fields = ['id', 'name', 'code', 'dean', 'dean_detail', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DepartmentSerializer(serializers.ModelSerializer):
    head_detail = UserListSerializer(source='head', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'faculty', 'faculty_name', 'name', 'code', 'head', 'head_detail', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AcademicSemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicSemester
        fields = ['id', 'year', 'semester', 'is_active', 'registration_start', 'registration_end', 'grade_lock_deadline']
        read_only_fields = ['id']


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Lesson
        fields = [
            'id', 'course', 'title', 'description', 'video_url',
            'file_url', 'order', 'status', 'duration_min',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LessonListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Lesson
        fields = ['id', 'title', 'order', 'status', 'duration_min', 'video_url', 'file_url']


class CourseSerializer(serializers.ModelSerializer):
    lessons        = LessonListSerializer(many=True, read_only=True)
    lesson_count   = serializers.ReadOnlyField()
    enrolled_count = serializers.ReadOnlyField()
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model  = Course
        fields = [
            'id', 'department', 'department_name', 'title', 'slug', 'description',
            'thumbnail', 'status', 'is_premium', 'price', 'category', 'tags',
            'lesson_count', 'enrolled_count', 'lessons',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def validate_status(self, value):
        if self.instance and value != self.instance.status:
            raise serializers.ValidationError(
                'Use the publish/unpublish endpoint to change course status.'
            )
        return value

    def create(self, validated_data):
        request = self.context['request']
        validated_data['created_by'] = request.user
        validated_data['status'] = Course.Status.DRAFT
        validated_data['slug'] = self._unique_slug(validated_data['title'])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'title' in validated_data and validated_data['title'] != instance.title:
            validated_data['slug'] = self._unique_slug(
                validated_data['title'], exclude_pk=instance.pk
            )
        return super().update(instance, validated_data)

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
    lesson_count   = serializers.ReadOnlyField()
    enrolled_count = serializers.ReadOnlyField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    thumbnail      = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = [
            'id', 'title', 'slug', 'department_name', 'thumbnail',
            'status', 'is_premium', 'price', 'category',
            'lesson_count', 'enrolled_count', 'created_at',
        ]

    def get_thumbnail(self, obj):
        if not obj.thumbnail:
            return None
        val = str(obj.thumbnail)
        if val.startswith('http://') or val.startswith('https://'):
            return val
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/media/{val}')
        return f'/media/{val}'


class CourseOfferingSerializer(serializers.ModelSerializer):
    course_detail = CourseListSerializer(source='course', read_only=True)
    semester_detail = AcademicSemesterSerializer(source='semester', read_only=True)
    instructor_detail = UserListSerializer(source='instructor', read_only=True)

    class Meta:
        model = CourseOffering
        fields = [
            'id', 'course', 'course_detail', 'semester', 'semester_detail',
            'instructor', 'instructor_detail', 'section_code', 'max_capacity', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ---------------------------------------------------------------------------
# Assignments & Submissions
# ---------------------------------------------------------------------------
class AssignmentSerializer(serializers.ModelSerializer):
    course_detail = CourseListSerializer(source='course', read_only=True)

    class Meta:
        model = Assignment
        fields = ['id', 'course', 'course_detail', 'title', 'description', 'due_date', 'total_marks', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_detail = UserListSerializer(source='student', read_only=True)
    assignment_detail = AssignmentSerializer(source='assignment', read_only=True)
    is_submitted = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'student', 'student_detail', 'assignment', 'assignment_detail',
            'submission_file', 'submission_text', 'grade', 'feedback', 'submitted_at', 'status', 'is_submitted'
        ]
        read_only_fields = ['id', 'student', 'submitted_at', 'status']

    def get_is_submitted(self, obj):
        return obj.status in [AssignmentSubmission.Status.SUBMITTED, AssignmentSubmission.Status.GRADED, AssignmentSubmission.Status.LATE]


# ---------------------------------------------------------------------------
# Quizzes, Questions, Choices & Submissions
# ---------------------------------------------------------------------------
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'question', 'text', 'is_correct']
        read_only_fields = ['id', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'quiz', 'text', 'question_type', 'order', 'points', 'choices']
        read_only_fields = ['id']


class QuizSerializer(serializers.ModelSerializer):
    course_detail = CourseListSerializer(source='course', read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'course', 'course_detail', 'title', 'description', 'time_limit_minutes', 'is_published', 'created_at', 'updated_at', 'questions', 'question_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_question_count(self, obj):
        return obj.questions.count()


class StudentAnswerSerializer(serializers.ModelSerializer):
    question_detail = QuestionSerializer(source='question', read_only=True)
    selected_choice_detail = ChoiceSerializer(source='selected_choice', read_only=True)

    class Meta:
        model = StudentAnswer
        fields = ['id', 'submission', 'question', 'question_detail', 'selected_choice', 'selected_choice_detail', 'text_answer', 'is_correct', 'points_awarded']
        read_only_fields = ['id', 'is_correct', 'points_awarded']


class QuizSubmissionSerializer(serializers.ModelSerializer):
    student_detail = UserListSerializer(source='student', read_only=True)
    quiz_detail = QuizSerializer(source='quiz', read_only=True)
    answers = StudentAnswerSerializer(many=True, read_only=True)
    score_percentage = serializers.SerializerMethodField()
    is_submitted = serializers.SerializerMethodField()

    class Meta:
        model = QuizSubmission
        fields = ['id', 'student', 'student_detail', 'quiz', 'quiz_detail', 'score', 'score_percentage', 'submitted_at', 'answers', 'is_submitted']
        read_only_fields = ['id', 'student', 'submitted_at', 'score', 'answers']

    def get_score_percentage(self, obj):
        # model stores score already as percentage by grade_submission
        return float(obj.score) if obj.score is not None else None

    def get_is_submitted(self, obj):
        return True if obj.submitted_at else False
