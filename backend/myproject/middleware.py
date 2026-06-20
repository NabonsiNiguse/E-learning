"""
Custom security middleware for the Learnly backend.

1. SecurityHeadersMiddleware  — adds CSP + Permissions-Policy to every response
2. InputSanitizationMiddleware — strips dangerous HTML/script patterns from
   JSON request bodies on mutation endpoints (POST/PUT/PATCH).

Neither middleware touches read-only (GET/HEAD/OPTIONS) requests.
"""

import json
import re
import logging

from django.http import JsonResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Patterns that represent XSS / injection payloads.
# These are intentionally broad — serializers still validate structure.
# ---------------------------------------------------------------------------
_XSS_PATTERNS = [
    re.compile(r'<script[\s\S]*?>[\s\S]*?</script>', re.IGNORECASE),
    re.compile(r'javascript\s*:', re.IGNORECASE),
    re.compile(r'on\w+\s*=', re.IGNORECASE),           # onclick=, onerror=, …
    re.compile(r'<iframe[\s\S]*?>', re.IGNORECASE),
    re.compile(r'<object[\s\S]*?>', re.IGNORECASE),
    re.compile(r'<embed[\s\S]*?>', re.IGNORECASE),
    re.compile(r'data\s*:\s*text/html', re.IGNORECASE),
    re.compile(r'vbscript\s*:', re.IGNORECASE),
]

# Endpoints that accept free-text user content — checked more strictly
_FREE_TEXT_PATHS = (
    '/api/v1/qa/',
    '/api/v1/assignments/',
    '/api/v1/notifications/',
    '/api/v1/courses/',
)

_MUTATION_METHODS = frozenset({'POST', 'PUT', 'PATCH'})


def _contains_xss(value: str) -> bool:
    return any(p.search(value) for p in _XSS_PATTERNS)


def _sanitize_value(v):
    """Recursively walk JSON-decoded data, reject if XSS pattern found."""
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return {k: _sanitize_value(val) for k, val in v.items()}
    if isinstance(v, list):
        return [_sanitize_value(item) for item in v]
    return v


def _check_for_xss(data, path: str = '') -> bool:
    """Return True if any string value contains an XSS pattern."""
    if isinstance(data, str):
        return _contains_xss(data)
    if isinstance(data, dict):
        return any(_check_for_xss(v, f'{path}.{k}') for k, v in data.items())
    if isinstance(data, list):
        return any(_check_for_xss(item, path) for item in data)
    return False


class InputSanitizationMiddleware:
    """
    Intercepts mutation requests on free-text endpoints and rejects
    any body that contains known XSS / HTML-injection payloads.

    DRF serializers handle structural validation; this catches raw
    script-injection attempts before they ever reach the serializer.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            request.method in _MUTATION_METHODS
            and any(request.path.startswith(p) for p in _FREE_TEXT_PATHS)
            and request.content_type
            and 'application/json' in request.content_type
        ):
            try:
                body = request.body
                if body:
                    data = json.loads(body)
                    if _check_for_xss(data):
                        logger.warning(
                            'XSS payload rejected | path=%s | ip=%s',
                            request.path,
                            request.META.get('REMOTE_ADDR', ''),
                        )
                        return JsonResponse(
                            {'detail': 'Request contains disallowed content.'},
                            status=400,
                        )
            except (json.JSONDecodeError, UnicodeDecodeError):
                # Malformed JSON — let DRF handle it downstream
                pass

        return self.get_response(request)


class SecurityHeadersMiddleware:
    """
    Appends security headers to every response.

    Content-Security-Policy is intentionally permissive for
    the SPA + YouTube embed use-case. Tighten frame-src in
    production when you know your CDN / media domains.
    """

    _CSP = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "          # Vite SPA needs inline
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https://images.unsplash.com https://api.dicebear.com; "
        "media-src 'self' https://www.youtube-nocookie.com; "
        "frame-src https://www.youtube-nocookie.com; "
        "connect-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Content-Security-Policy']   = self._CSP
        response['X-Content-Type-Options']    = 'nosniff'
        response['X-Frame-Options']           = 'DENY'
        response['Referrer-Policy']           = 'strict-origin-when-cross-origin'
        response['Permissions-Policy']        = (
            'camera=(), microphone=(), geolocation=(), payment=()'
        )
        response['X-XSS-Protection']         = '1; mode=block'
        return response
