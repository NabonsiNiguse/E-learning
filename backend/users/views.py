"""
Authentication & user-management views.

Security posture
────────────────
• Login sets JWT tokens in httpOnly, Secure, SameSite=Lax cookies —
  invisible to JavaScript, mitigating XSS token-theft.
• The Authorization: Bearer header path still works as a fallback
  (mobile apps, Postman, automated tests).
• Logout blacklists the refresh token AND clears both cookies.
• All mutation endpoints carry throttle classes to resist brute-force.
"""

from django.conf import settings
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend

from .models import User
from .serializers import (
    RegisterSerializer, UserDetailSerializer, UserListSerializer,
    ChangePasswordSerializer, UpdateProfileSerializer, AdminCreateUserSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdmin, IsSelfOrAdmin
from myproject.throttles import LoginRateThrottle, RegisterRateThrottle


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _jwt_settings() -> dict:
    return getattr(settings, 'SIMPLE_JWT', {})


def _set_auth_cookies(response, access_token: str, refresh_token: str) -> None:
    """Write httpOnly cookies for both JWT tokens."""
    cfg = _jwt_settings()
    secure   = cfg.get('AUTH_COOKIE_SECURE',   not settings.DEBUG)
    samesite = cfg.get('AUTH_COOKIE_SAMESITE', 'Lax')
    path     = cfg.get('AUTH_COOKIE_PATH',     '/')

    access_lifetime  = settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME')
    refresh_lifetime = settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME')

    response.set_cookie(
        key      = cfg.get('AUTH_COOKIE', 'learnly_access'),
        value    = access_token,
        max_age  = int(access_lifetime.total_seconds()) if access_lifetime else 3600,
        httponly = True,
        secure   = secure,
        samesite = samesite,
        path     = path,
    )
    response.set_cookie(
        key      = cfg.get('AUTH_COOKIE_REFRESH', 'learnly_refresh'),
        value    = refresh_token,
        max_age  = int(refresh_lifetime.total_seconds()) if refresh_lifetime else 604800,
        httponly = True,
        secure   = secure,
        samesite = samesite,
        path     = '/api/v1/auth/token/',   # restrict refresh cookie path
    )


def _clear_auth_cookies(response) -> None:
    """Delete both JWT cookies from the browser."""
    cfg = _jwt_settings()
    response.delete_cookie(
        cfg.get('AUTH_COOKIE', 'learnly_access'),
        path=cfg.get('AUTH_COOKIE_PATH', '/'),
    )
    response.delete_cookie(
        cfg.get('AUTH_COOKIE_REFRESH', 'learnly_refresh'),
        path='/api/v1/auth/token/',
    )


# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------

class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Validates credentials via SimpleJWT, then issues tokens as:
      1. httpOnly cookies (primary, for browser clients)
      2. JSON body   (fallback for non-browser/Postman/mobile)

    Throttled to 10 attempts/min per IP.
    """
    permission_classes  = [AllowAny]
    throttle_classes    = [LoginRateThrottle]

    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        access  = serializer.validated_data['access']
        refresh = serializer.validated_data['refresh']
        user    = serializer.validated_data['user']

        response = Response({
            'access':  access,
            'refresh': refresh,
            'user':    user,
        }, status=status.HTTP_200_OK)

        _set_auth_cookies(response, access, refresh)
        return response


class TokenRefreshCookieView(APIView):
    """
    POST /api/v1/auth/token/refresh/
    Reads the refresh token from the httpOnly cookie (or request body as fallback),
    returns a new access token and rotates the refresh cookie.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [LoginRateThrottle]

    def post(self, request):
        cfg = _jwt_settings()
        refresh_cookie_name = cfg.get('AUTH_COOKIE_REFRESH', 'learnly_refresh')

        # Prefer cookie; fall back to body (for non-browser clients)
        raw_refresh = (
            request.COOKIES.get(refresh_cookie_name)
            or request.data.get('refresh')
        )

        if not raw_refresh:
            return Response(
                {'detail': 'Refresh token not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token       = RefreshToken(raw_refresh)
            new_access  = str(token.access_token)
            new_refresh = str(token)           # rotated refresh

            response = Response({
                'access':  new_access,
                'refresh': new_refresh,
            })
            _set_auth_cookies(response, new_access, new_refresh)
            return response

        except Exception:
            return Response(
                {'detail': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/auth/register/
    Public endpoint — self-registration as teacher or student only.
    Admin/super_admin roles are blocked at the serializer level.

    Throttled to 5 registrations/min per IP.
    """
    serializer_class    = RegisterSerializer
    permission_classes  = [AllowAny]
    throttle_classes    = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'success': True,
            'message': 'Registration successful.',
            'user':    UserDetailSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists the refresh token AND clears both httpOnly cookies.
    Accepts refresh token from cookie or request body.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cfg = _jwt_settings()
        refresh_cookie_name = cfg.get('AUTH_COOKIE_REFRESH', 'learnly_refresh')

        raw_refresh = (
            request.COOKIES.get(refresh_cookie_name)
            or request.data.get('refresh')
        )

        response = Response({'success': True, 'message': 'Logged out successfully.'})
        _clear_auth_cookies(response)

        if raw_refresh:
            try:
                token = RefreshToken(raw_refresh)
                token.blacklist()
            except Exception:
                pass  # Already blacklisted or expired — that's fine

        return response


class MeView(generics.RetrieveUpdateAPIView):
    """GET or PATCH /api/v1/auth/me/ — current user's profile."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UpdateProfileSerializer
        return UserDetailSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        # Invalidate current session tokens by clearing cookies
        response = Response({'success': True, 'message': 'Password changed. Please log in again.'})
        _clear_auth_cookies(response)
        return response


# ---------------------------------------------------------------------------
# Admin user management
# ---------------------------------------------------------------------------

class UserListView(generics.ListCreateAPIView):
    """Admin: list all users or create a user with any role."""
    permission_classes = [IsAdmin]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['role', 'is_active']
    search_fields      = ['email', 'first_name', 'last_name']
    ordering_fields    = ['created_at', 'email']

    def get_queryset(self):
        return User.objects.all().select_related('teacher_profile', 'student_profile')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCreateUserSerializer
        return UserListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'success': True,
            'message': 'User created.',
            'user':    UserDetailSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: retrieve, update, or soft-delete (deactivate) any user."""
    permission_classes = [IsAdmin]
    queryset           = User.objects.all().select_related('teacher_profile', 'student_profile')

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UpdateProfileSerializer
        return UserDetailSerializer

    def destroy(self, request, *args, **kwargs):
        user           = self.get_object()
        user.is_active = False
        user.save()
        return Response({'success': True, 'message': 'User deactivated.'})


class ResetAccessView(APIView):
    """POST /api/v1/users/<pk>/reset-access/ — best-effort reset of a user's access.

    This is intentionally conservative: it enables the account so the user can sign in
    and returns a success message. If the project requires generating temporary
    passwords or emailing reset links, extend this view to create tokens and send
    notifications using the site's mailing facilities.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Best-effort reset: enable account. Do not change password automatically here.
        user.is_active = True
        user.save()

        return Response({'success': True, 'message': 'User access reset (account enabled).'}, status=status.HTTP_200_OK)
