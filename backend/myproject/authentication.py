"""
Cookie-based JWT authentication backend.

Reads the access token from the httpOnly 'learnly_access' cookie instead
of the Authorization header. Falls back to the standard header so existing
Bearer-token flows (e.g., mobile apps, Postman) continue to work.

Registered in settings.py under REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES
as the *first* entry so cookies take precedence.
"""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Extends SimpleJWT's default authenticator to read the access token
    from an httpOnly cookie before falling back to the Authorization header.
    """

    def authenticate(self, request):
        # 1. Try reading from the cookie
        cookie_name: str = getattr(
            settings, 'SIMPLE_JWT', {}
        ).get('AUTH_COOKIE', 'learnly_access')

        raw_token = request.COOKIES.get(cookie_name)

        if raw_token:
            try:
                validated_token = self.get_validated_token(raw_token)
                user = self.get_user(validated_token)
                return user, validated_token
            except InvalidToken:
                # Cookie token is invalid/expired — fall through to header
                pass

        # 2. Fall back to the standard Authorization: Bearer <token> header
        return super().authenticate(request)
