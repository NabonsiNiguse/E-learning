"""
Registers all models with the custom Learnly admin site.
Imported once from urls.py.
"""
from myproject.admin_site import admin_site

# ── Users ──────────────────────────────────────────────────────────────────
from users.models import User, TeacherProfile, StudentProfile
from users.admin import UserAdmin, TeacherProfileAdmin, StudentProfileAdmin

admin_site.register(User,           UserAdmin)
admin_site.register(TeacherProfile, TeacherProfileAdmin)
admin_site.register(StudentProfile, StudentProfileAdmin)

# ── Courses ────────────────────────────────────────────────────────────────
from courses.models import Course, Lesson
from courses.admin import CourseAdmin, LessonAdmin

admin_site.register(Course, CourseAdmin)
admin_site.register(Lesson, LessonAdmin)

# ── Enrollments ────────────────────────────────────────────────────────────
from enrollments.models import Enrollment
from enrollments.admin import EnrollmentAdmin

admin_site.register(Enrollment, EnrollmentAdmin)

# ── Payments ───────────────────────────────────────────────────────────────
from payments.models import Payment
from payments.admin import PaymentAdmin

admin_site.register(Payment, PaymentAdmin)

# ── Notifications ──────────────────────────────────────────────────────────
from notifications.models import Notification, Message
from notifications.admin import NotificationAdmin, MessageAdmin

admin_site.register(Notification, NotificationAdmin)
admin_site.register(Message,      MessageAdmin)

# ── Attendance ─────────────────────────────────────────────────────────────
from attendance.models import AttendanceRecord
from attendance.admin import AttendanceRecordAdmin

admin_site.register(AttendanceRecord, AttendanceRecordAdmin)

# ── Results (includes GradeAppeal, GradingScale, StudentResult, AuditLog) ──
from results.models import GradingScale, GradingRule, StudentResult, ResultAuditLog, GradeAppeal
from results.admin import (
    GradingScaleAdmin, StudentResultAdmin,
    ResultAuditLogAdmin, GradeAppealAdmin,
)

admin_site.register(GradingScale,   GradingScaleAdmin)
admin_site.register(StudentResult,  StudentResultAdmin)
admin_site.register(ResultAuditLog, ResultAuditLogAdmin)
admin_site.register(GradeAppeal,    GradeAppealAdmin)

# ── GradeCorrection (grading app — standalone model, no db_table conflict) ─
from grading.models import GradeCorrection
from grading.admin import GradeCorrectionAdmin

admin_site.register(GradeCorrection, GradeCorrectionAdmin)

# ── Progress ───────────────────────────────────────────────────────────────
from progress.models import Progress
from progress.admin import ProgressAdmin

admin_site.register(Progress, ProgressAdmin)
