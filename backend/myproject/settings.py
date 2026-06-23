"""
Django settings for myproject — E-Learning Platform
Production-ready configuration using python-decouple for env management.
"""

from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',

    # Local apps
    'users.apps.UsersConfig',
    'courses.apps.CoursesConfig',
    'enrollments.apps.EnrollmentsConfig',
    'progress.apps.ProgressConfig',
    'payments.apps.PaymentsConfig',
    'notifications.apps.NotificationsConfig',
    'dashboard.apps.DashboardConfig',
    'attendance.apps.AttendanceConfig',
    'results.apps.ResultsConfig',
    'grading.apps.GradingConfig',
]

# ---------------------------------------------------------------------------
# Middleware  — order matters
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    # ── Custom security middleware ──────────────────────────────────────────
    'myproject.middleware.SecurityHeadersMiddleware',   # CSP + extra headers
    'myproject.middleware.InputSanitizationMiddleware', # XSS strip on JSON bodies
    # ───────────────────────────────────────────────────────────────────────
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myproject.wsgi.application'

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.sqlite3'),
        'NAME': BASE_DIR / config('DB_NAME', default='db.sqlite3'),
        # Production Postgres extra options (ignored if using SQLite)
        'USER':     config('DB_USER',     default=''),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST':     config('DB_HOST',     default=''),
        'PORT':     config('DB_PORT',     default=''),
        'OPTIONS': {
            'connect_timeout': 10,
        } if config('DB_ENGINE', default='').endswith('postgresql') else {},
    }
}

# ---------------------------------------------------------------------------
# Custom User Model
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = 'users.User'

# ---------------------------------------------------------------------------
# Password Validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ---------------------------------------------------------------------------
# Django REST Framework  — with throttle classes
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Cookie-based JWT first, then Bearer header fallback
        'myproject.authentication.CookieJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'myproject.pagination.StandardResultsPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'EXCEPTION_HANDLER': 'myproject.exceptions.custom_exception_handler',
    # ── Rate limiting ───────────────────────────────────────────────────────
    'DEFAULT_THROTTLE_CLASSES': [
        'myproject.throttles.BurstRateThrottle',
        'myproject.throttles.SustainedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'burst':     '60/min',      # max 60 req/min per user/IP
        'sustained': '1000/day',    # max 1000 req/day per user/IP
        'login':     '10/min',      # tighter limit for auth endpoints
        'register':  '5/min',
    },
}

# ---------------------------------------------------------------------------
# SimpleJWT
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('ACCESS_TOKEN_LIFETIME_MINUTES', default=60, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('REFRESH_TOKEN_LIFETIME_DAYS', default=7, cast=int)
    ),
    'ROTATE_REFRESH_TOKENS':   True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN':        True,
    'ALGORITHM':                'HS256',
    'SIGNING_KEY':              SECRET_KEY,
    'AUTH_HEADER_TYPES':        ('Bearer',),
    'USER_ID_FIELD':            'id',
    'USER_ID_CLAIM':            'user_id',
    'TOKEN_OBTAIN_SERIALIZER':  'users.serializers.CustomTokenObtainPairSerializer',
    # httpOnly cookie settings
    'AUTH_COOKIE':              'learnly_access',
    'AUTH_COOKIE_REFRESH':      'learnly_refresh',
    'AUTH_COOKIE_SECURE':       config('COOKIE_SECURE', default=not DEBUG, cast=bool),
    'AUTH_COOKIE_HTTP_ONLY':    True,
    'AUTH_COOKIE_SAMESITE':     'Lax',
    'AUTH_COOKIE_PATH':         '/',
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173'
).split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]

# ---------------------------------------------------------------------------
# Security Headers  (production)
# ---------------------------------------------------------------------------
SECURE_BROWSER_XSS_FILTER       = True
SECURE_CONTENT_TYPE_NOSNIFF     = True
X_FRAME_OPTIONS                  = 'DENY'
SECURE_REFERRER_POLICY           = 'strict-origin-when-cross-origin'

# These activate only when COOKIE_SECURE=True (i.e. HTTPS in production)
_COOKIE_SECURE = config('COOKIE_SECURE', default=not DEBUG, cast=bool)

SESSION_COOKIE_SECURE   = _COOKIE_SECURE
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

CSRF_COOKIE_SECURE      = _COOKIE_SECURE
CSRF_COOKIE_HTTPONLY    = False  # Must be False so JS can read it for AJAX
CSRF_COOKIE_SAMESITE    = 'Lax'
CSRF_TRUSTED_ORIGINS    = CORS_ALLOWED_ORIGINS

# HSTS — only in production (handled by nginx too, but belt-and-suspenders)
if _COOKIE_SECURE:
    SECURE_HSTS_SECONDS            = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD            = True
    SECURE_SSL_REDIRECT            = True

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'UTC'
USE_I18N      = True
USE_TZ        = True

# ---------------------------------------------------------------------------
# Static / Media
# ---------------------------------------------------------------------------
STATIC_URL  = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL   = '/media/'
MEDIA_ROOT  = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# Logging (errors to console; wire to Sentry/file in production)
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django.security': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static / Media
# ---------------------------------------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
