from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        SUPER_ADMIN = 'super_admin', 'Super Admin'
        ADMIN       = 'admin',       'Admin'
        DEAN        = 'dean',        'Faculty Dean'
        DEPT_HEAD   = 'dept_head',   'Department Head'
        TEACHER     = 'teacher',     'Teacher'
        STUDENT     = 'student',     'Student'

    email      = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100)
    role       = models.CharField(max_length=15, choices=Role.choices, default=Role.STUDENT)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    avatar     = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.full_name} <{self.email}>'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def is_super_admin(self):
        return self.role == self.Role.SUPER_ADMIN

    @property
    def is_admin(self):
        return self.role in (self.Role.ADMIN, self.Role.SUPER_ADMIN)

    @property
    def is_admin_only(self):
        """True only for plain Admin, not Super Admin."""
        return self.role == self.Role.ADMIN

    @property
    def is_dean(self):
        return self.role == self.Role.DEAN

    @property
    def is_dept_head(self):
        return self.role == self.Role.DEPT_HEAD

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT


class TeacherProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    bio         = models.TextField(blank=True)
    expertise   = models.CharField(max_length=255, blank=True)
    website     = models.URLField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_profiles'

    def __str__(self):
        return f'TeacherProfile({self.user.email})'


class StudentProfile(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    bio         = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_profiles'

    def __str__(self):
        return f'StudentProfile({self.user.email})'
