from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from myproject.admin_site import admin_site
import myproject.admin_register  # noqa — registers all models with admin_site

urlpatterns = [
    path('admin/', admin_site.urls),

    # API v1
    path('api/v1/auth/',            include('users.urls.auth_urls')),
    path('api/v1/users/',           include('users.urls.user_urls')),
    path('api/v1/courses/',         include('courses.urls')),
    path('api/v1/teacher/courses/', include('courses.teacher_urls')),
    path('api/v1/enrollments/',     include('enrollments.urls')),
    path('api/v1/progress/',        include('progress.urls')),
    path('api/v1/payments/',        include('payments.urls')),
    path('api/v1/notifications/',   include('notifications.urls')),
    path('api/v1/dashboard/',       include('dashboard.urls')),
    path('api/v1/attendance/',      include('attendance.urls')),
    path('api/v1/results/',         include('results.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
