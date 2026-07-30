from django.db import models
from django.conf import settings


class Faculty(models.Model):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=10, unique=True)
    dean = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deaned_faculties',
        limit_choices_to={'role': 'dean'},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'faculties'
        verbose_name_plural = 'Faculties'

    def __str__(self):
        return self.name


class Department(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, unique=True)
    head = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments',
        limit_choices_to={'role': 'dept_head'},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'

    def __str__(self):
        return self.name


class Course(models.Model):
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        PUBLISHED = 'published', 'Published'
        ARCHIVED  = 'archived',  'Archived'

    department   = models.ForeignKey(
        Department,
        on_delete=models.RESTRICT,
        related_name='courses',
        null=True,
    )
    title        = models.CharField(max_length=255)
    slug         = models.SlugField(max_length=255, unique=True)
    description  = models.TextField()
    level        = models.CharField(max_length=50, default='Beginner', blank=True)
    credits      = models.PositiveSmallIntegerField(default=3)
    thumbnail    = models.ImageField(upload_to='course_thumbnails/', null=True, blank=True)
    status       = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    is_premium   = models.BooleanField(default=False)
    price        = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    category     = models.CharField(max_length=100, blank=True)
    tags         = models.CharField(max_length=255, blank=True, help_text='Comma-separated tags')
    locked       = models.BooleanField(default=False, help_text='If True, no more grade changes allowed.')
    results_submitted_at = models.DateTimeField(null=True, blank=True, help_text='When final results were submitted.')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='courses_created', editable=False,
    )

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def __init__(self, *args, **kwargs):
        level = kwargs.pop('level', None)
        super().__init__(*args, **kwargs)
        if level is not None:
            try:
                setattr(self, 'level', level)
            except Exception:
                pass

    @property
    def lesson_count(self):
        return self.lessons.count()

    @property
    def enrolled_count(self):
        # Count unique students enrolled in active offerings of this course
        from enrollments.models import Enrollment
        return Enrollment.objects.filter(course_offering__course=self, status='active').count()


class Module(models.Model):
    course = models.ForeignKey('Course', on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'modules'
        ordering = ['order']
        unique_together = [('course', 'order')]
        indexes = [models.Index(fields=['course'])]

    def __str__(self):
        return f'{self.course.title} — {self.title}'


class AcademicSemester(models.Model):
    year = models.PositiveIntegerField()
    semester = models.CharField(max_length=50)  # 'Fall', 'Spring', 'Summer'
    is_active = models.BooleanField(default=False)
    registration_start = models.DateTimeField(null=True, blank=True)
    registration_end = models.DateTimeField(null=True, blank=True)
    grade_lock_deadline = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'academic_semesters'
        unique_together = ('year', 'semester')

    def __str__(self):
        return f"{self.semester} {self.year}"


class CourseOffering(models.Model):
    course = models.ForeignKey(Course, on_delete=models.RESTRICT, related_name='offerings')
    semester = models.ForeignKey(AcademicSemester, on_delete=models.RESTRICT, related_name='offerings')
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='course_offerings',
        limit_choices_to={'role': 'teacher'},
    )
    section_code = models.CharField(max_length=10)  # e.g., 'A', 'B'
    max_capacity = models.PositiveIntegerField(default=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'course_offerings'
        unique_together = ('course', 'semester', 'section_code')

    def __str__(self):
        return f"{self.course.title} - Section {self.section_code} ({self.semester})"


class Lesson(models.Model):
    class Status(models.TextChoices):
        DRAFT     = 'draft',     'Draft'
        PUBLISHED = 'published', 'Published'

    module       = models.ForeignKey('Module', on_delete=models.SET_NULL, null=True, blank=True, related_name='lessons')
    course       = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons', db_index=True)
    title        = models.CharField(max_length=255)
    description  = models.TextField(blank=True)
    video_url    = models.URLField(blank=True)
    file_url     = models.URLField(blank=True)
    order        = models.PositiveIntegerField(default=0)
    status       = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    duration_min = models.PositiveIntegerField(default=0, help_text='Duration in minutes')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    created_by   = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='lessons_created', editable=False,
    )

    class Meta:
        db_table = 'lessons'
        ordering = ['order']
        unique_together = [('course', 'order')]

    def __str__(self):
        return f'{self.course.title} — {self.title}'


class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'assignments'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['course'])]

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class AssignmentSubmission(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUBMITTED = 'submitted', 'Submitted'
        GRADED = 'graded', 'Graded'
        LATE = 'late', 'Late'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assignment_submissions',
        limit_choices_to={'role': 'student'},
    )
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    submission_file = models.FileField(upload_to='assignments/submissions/', null=True, blank=True)
    submission_text = models.TextField(blank=True)
    grade = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    class Meta:
        db_table = 'assignment_submissions'
        ordering = ['-submitted_at']
        indexes = [models.Index(fields=['student']), models.Index(fields=['assignment']), models.Index(fields=['submitted_at'])]

    def __str__(self):
        return f"Submission({self.assignment.title}) by {self.student.email} — {self.status}"


class Quiz(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quizzes'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['course'])]

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class Question(models.Model):
    class Type(models.TextChoices):
        MCQ = 'mcq', 'Multiple Choice'
        TEXT = 'text', 'Text Answer'

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=Type.choices, default=Type.MCQ)
    order = models.PositiveIntegerField(default=0)
    points = models.DecimalField(max_digits=6, decimal_places=2, default=1)

    class Meta:
        db_table = 'questions'
        ordering = ['order']
        indexes = [models.Index(fields=['quiz'])]

    def __str__(self):
        return f"Q{self.order}: {self.text[:60]}"


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=1024)
    is_correct = models.BooleanField(default=False)

    class Meta:
        db_table = 'choices'

    def __str__(self):
        return f"Choice({self.question.id}): {self.text[:80]}"


class QuizSubmission(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_submissions')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='submissions')
    score = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'quiz_submissions'
        ordering = ['-submitted_at']
        indexes = [models.Index(fields=['student']), models.Index(fields=['quiz'])]

    def __str__(self):
        return f"QuizSubmission({self.quiz.title}) by {self.student.email} — {self.score}"

    def grade_submission(self):
        """Compute score from related StudentAnswer rows and update score."""
        total = 0
        obtained = 0
        for q in self.quiz.questions.all():
            total += float(q.points)
        for ans in self.answers.all():
            if ans.is_correct:
                obtained += float(ans.points_awarded or 0)
        self.score = (obtained if total == 0 else (obtained / total) * 100)
        self.save()


class StudentAnswer(models.Model):
    submission = models.ForeignKey(QuizSubmission, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='+')
    selected_choice = models.ForeignKey(Choice, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    text_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)
    points_awarded = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'student_answers'
        indexes = [models.Index(fields=['submission']), models.Index(fields=['question'])]

    def __str__(self):
        return f"Answer({self.question.id}) — {self.submission.student.email}"
