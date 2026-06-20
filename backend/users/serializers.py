from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, TeacherProfile, StudentProfile


# ---------------------------------------------------------------------------
# JWT — inject role + name into token payload
# ---------------------------------------------------------------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role']         = user.role
        token['full_name']    = user.full_name
        token['email']        = user.email
        token['is_super_admin'] = user.is_super_admin
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserDetailSerializer(self.user).data
        return data


# ---------------------------------------------------------------------------
# Profile serializers
# ---------------------------------------------------------------------------
class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TeacherProfile
        fields = ['bio', 'expertise', 'website']


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = StudentProfile
        fields = ['bio']


# ---------------------------------------------------------------------------
# User serializers
# ---------------------------------------------------------------------------
class UserDetailSerializer(serializers.ModelSerializer):
    full_name       = serializers.ReadOnlyField()
    teacher_profile = TeacherProfileSerializer(read_only=True)
    student_profile = StudentProfileSerializer(read_only=True)

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'avatar', 'is_active', 'created_at', 'updated_at',
            'teacher_profile', 'student_profile',
        ]
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']


class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model  = User
        fields = ['id', 'email', 'full_name', 'role', 'is_active', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')
    role      = serializers.ChoiceField(
        choices=[User.Role.TEACHER, User.Role.STUDENT],
        default=User.Role.STUDENT,
    )

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password2', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        # Prevent self-assigning admin/super_admin role via public registration
        if attrs.get('role') in (User.Role.ADMIN, User.Role.SUPER_ADMIN):
            raise serializers.ValidationError({'role': 'Cannot register as admin.'})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # Auto-create profile based on role
        if user.role == User.Role.TEACHER:
            TeacherProfile.objects.create(user=user)
        else:
            StudentProfile.objects.create(user=user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class UpdateProfileSerializer(serializers.ModelSerializer):
    teacher_profile = TeacherProfileSerializer(required=False)
    student_profile = StudentProfileSerializer(required=False)

    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'avatar', 'teacher_profile', 'student_profile']

    def update(self, instance, validated_data):
        teacher_data = validated_data.pop('teacher_profile', None)
        student_data = validated_data.pop('student_profile', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if teacher_data and hasattr(instance, 'teacher_profile'):
            for attr, value in teacher_data.items():
                setattr(instance.teacher_profile, attr, value)
            instance.teacher_profile.save()

        if student_data and hasattr(instance, 'student_profile'):
            for attr, value in student_data.items():
                setattr(instance.student_profile, attr, value)
            instance.student_profile.save()

        return instance


class AdminCreateUserSerializer(serializers.ModelSerializer):
    """Admin-only: can create users with any role."""
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'password', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        if user.role == User.Role.TEACHER:
            TeacherProfile.objects.get_or_create(user=user)
        elif user.role == User.Role.STUDENT:
            StudentProfile.objects.get_or_create(user=user)
        return user
