# Teacher Role Definition

## Overview
Teachers are responsible for managing their assigned courses, creating assessments, grading student work, and submitting final results. Teachers have limited scope — they can only manage courses and students they are directly assigned to.

## Core Responsibilities

### 1. Manage Assigned Courses
- **View**: Teachers can view only courses they created/own
- **Create**: Teachers can create new courses
- **Edit**: Teachers can edit their own courses (title, description, thumbnail, status, price, category, tags)
- **Delete**: Teachers can delete their own courses (only if no active enrollments)
- **Publish**: Teachers can publish/archive their own courses
- **Permissions**: Cannot view or edit courses created by other teachers

**Endpoints**:
- `GET /api/v1/courses/` — List own courses
- `POST /api/v1/courses/` — Create new course
- `GET /api/v1/courses/{id}/` — View own course details
- `PATCH /api/v1/courses/{id}/` — Update own course
- `DELETE /api/v1/courses/{id}/` — Delete own course

### 2. Create and Grade Assessments
- **Create Assignments**: Teachers can create assignments for their courses
- **Create Quizzes**: Teachers can create quizzes for their courses
- **View Submissions**: Teachers can view all submissions for their course assignments
- **Grade Submissions**: Teachers can enter grades for student submissions
- **Provide Feedback**: Teachers can add comments/feedback to submissions
- **Permissions**: Cannot grade submissions from other teachers' courses

**Endpoints**:
- `POST /api/v1/assignments/` — Create assignment
- `PATCH /api/v1/assignments/{id}/` — Update assignment
- `GET /api/v1/assignments/{id}/submissions/` — View submissions for assignment
- `PATCH /api/v1/submissions/{id}/grade/` — Grade a submission
- `POST /api/v1/submissions/{id}/feedback/` — Add feedback

### 3. Enter and Manage Student Scores
- **View Scores**: Teachers can view all scores for their course students
- **Enter Scores**: Teachers can manually enter/update scores for assignments and quizzes
- **Correct Scores**: Teachers can correct grades with a reason (audit trail maintained)
- **View Score History**: Teachers can see all corrections made to a score
- **Bulk Upload**: Teachers can bulk upload scores via CSV
- **Permissions**: Cannot modify scores for other teachers' courses

**Endpoints**:
- `GET /api/v1/results/scores/` — List scores for own courses
- `POST /api/v1/results/corrections/` — Create grade correction
- `GET /api/v1/results/corrections/` — View corrections made by teacher
- `GET /api/v1/results/scores/{id}/history/` — View score history
- `POST /api/v1/results/bulk-upload/` — Bulk upload scores

### 4. Submit Final Results
- **Mark Complete**: Teachers can mark a course as complete
- **Submit Results**: Teachers can submit final grades for all students
- **Lock Results**: Teachers can lock results to prevent further changes
- **Generate Report**: Teachers can generate final grade reports
- **Export Results**: Teachers can export results as PDF/CSV
- **Permissions**: Can only submit results for their own courses

**Endpoints**:
- `POST /api/v1/courses/{id}/submit-results/` — Submit final results
- `PATCH /api/v1/courses/{id}/lock-results/` — Lock results
- `GET /api/v1/courses/{id}/final-report/` — Generate final report
- `GET /api/v1/courses/{id}/export-results/` — Export results

## Grade Appeal Management

Teachers can:
- **Review Appeals**: Review grade appeals submitted by students
- **Respond to Appeals**: Provide a response/explanation for the grade
- **Escalate Appeals**: Escalate unresolved appeals to Super Admin
- **View Appeal History**: See all appeals for their courses

**Endpoints**:
- `GET /api/v1/results/appeals/` — List appeals for own courses
- `PATCH /api/v1/results/appeals/{id}/review/` — Review and respond to appeal
- `PATCH /api/v1/results/appeals/{id}/escalate/` — Escalate appeal

## Classroom Management

Teachers can:
- **View Students**: View all students enrolled in their courses
- **Track Attendance**: Mark and view attendance for their courses
- **Send Messages**: Send messages to students in their courses
- **View Q&A**: Answer questions posted by students in their courses
- **Permissions**: Cannot access students from other teachers' courses

**Endpoints**:
- `GET /api/v1/students/?course={id}` — List students in course
- `POST /api/v1/attendance/` — Mark attendance
- `GET /api/v1/attendance/?course={id}` — View attendance records
- `POST /api/v1/messages/` — Send message
- `GET /api/v1/qa/?course={id}` — View Q&A for course

## Restrictions & Limitations

### Cannot Do:
- ❌ View or manage courses created by other teachers
- ❌ Grade submissions from other teachers' courses
- ❌ Override grade appeals (only Super Admin can)
- ❌ Delete student accounts
- ❌ Modify user roles
- ❌ Access admin dashboard
- ❌ View system-wide reports
- ❌ Manage payments
- ❌ Create or manage other teacher accounts

### Audit Trail:
- All grade corrections are logged with:
  - Who made the change (teacher name + ID)
  - When the change was made (timestamp)
  - What changed (old score → new score)
  - Why it changed (reason provided by teacher)
- Teachers cannot edit or delete corrections once created
- All corrections are immutable for audit compliance

## Permission Matrix

| Action | Super Admin | Admin | Teacher | Student |
|--------|-------------|-------|---------|---------|
| Create Course | ✓ | ✗ | ✓ (own) | ✗ |
| Edit Course | ✓ | ✗ | ✓ (own) | ✗ |
| Delete Course | ✓ | ✗ | ✓ (own) | ✗ |
| Create Assignment | ✓ | ✗ | ✓ (own) | ✗ |
| Grade Submission | ✓ | ✗ | ✓ (own) | ✗ |
| Correct Grade | ✓ | ✗ | ✓ (own) | ✗ |
| Review Appeal | ✓ | ✗ | ✓ (own) | ✗ |
| Override Appeal | ✓ | ✗ | ✗ | ✗ |
| Submit Results | ✓ | ✗ | ✓ (own) | ✗ |
| View All Courses | ✓ | ✓ | ✗ | ✗ |
| View All Grades | ✓ | ✓ | ✗ | ✗ |

## Implementation Notes

1. **Scope Enforcement**: All queries must filter by `teacher=request.user` for teachers
2. **Audit Logging**: Every grade change must create an immutable GradeCorrection record
3. **Validation**: Teachers cannot bypass course ownership checks
4. **API Responses**: Teachers only see data for their courses in list endpoints
5. **Error Handling**: Return 403 Forbidden if teacher tries to access another teacher's data

## Frontend Sidebar Navigation for Teachers

Teachers see these menu items:
- Dashboard
- Learning (Courses, Videos, Lessons, Shorts, Materials)
- Assessments (Assignments, Quizzes, Results)
- Grade Appeals
- Classroom (Attendance, Messages, Q&A, Students)
- Performance (Progress, Reports)
- Settings (Profile, Account)

Teachers do NOT see:
- Users management
- Payments
- Certificates
- System-wide admin features
