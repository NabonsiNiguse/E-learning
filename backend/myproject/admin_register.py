from myproject.admin_site import admin_site

# ── Users ──────────────────────────────────────────────────────────────────
from users.models import User, TeacherProfile, StudentProfile
from users.admin import UserAdmin, TeacherProfileAdmin, StudentProfileAdmin

admin_site.register(User,           UserAdmin)
admin_site.register(TeacherProfile, TeacherProfileAdmin)
admin_site.register(StudentProfile, StudentProfileAdmin)

# ── Courses ────────────────────────────────────────────────────────────────
from courses.models import Faculty, Department, AcademicSemester, CourseOffering, Course, Lesson
from courses.admin import FacultyAdmin, DepartmentAdmin, AcademicSemesterAdmin, CourseOfferingAdmin, CourseAdmin, LessonAdmin

admin_site.register(Faculty,          FacultyAdmin)
admin_site.register(Department,       DepartmentAdmin)
admin_site.register(AcademicSemester, AcademicSemesterAdmin)
admin_site.register(CourseOffering,   CourseOfferingAdmin)
admin_site.register(Course,           CourseAdmin)
admin_site.register(Lesson,           LessonAdmin)

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

# ── Results ────────────────────────────────────────────────────────────────
from results.models import GradingScale, AssessmentTemplate, AssessmentScore, Grade, AcademicAuditLog, GradeAppeal
from results.admin import (
    GradingScaleAdmin, AssessmentTemplateAdmin, AssessmentScoreAdmin,
    GradeAdmin, AcademicAuditLogAdmin, GradeAppealAdmin,
)

admin_site.register(GradingScale,       GradingScaleAdmin)
admin_site.register(AssessmentTemplate, AssessmentTemplateAdmin)
admin_site.register(AssessmentScore,    AssessmentScoreAdmin)
admin_site.register(Grade,             GradeAdmin)
admin_site.register(AcademicAuditLog,   AcademicAuditLogAdmin)
admin_site.register(GradeAppeal,        GradeAppealAdmin)

# ── GradeCorrection (grading app) ─
from grading.models import GradeCorrection
from grading.admin import GradeCorrectionAdmin

admin_site.register(GradeCorrection, GradeCorrectionAdmin)

# ── Progress ───────────────────────────────────────────────────────────────
from progress.models import Progress
from progress.admin import ProgressAdmin

admin_site.register(Progress, ProgressAdmin)
