# Results System — Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         RESULTS SYSTEM ARCHITECTURE                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              /results-unified
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │   Teacher    │ │   Student    │ │    Admin     │
            │  Dashboard   │ │  Dashboard   │ │  Dashboard   │
            └──────────────┘ └──────────────┘ └──────────────┘
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │ Score Entry  │ │ View Results │ │ Full Control │
            │ & Submit     │ │ & Appeal     │ │ & Approval   │
            └──────────────┘ └──────────────┘ └──────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │   API Client         │
                        │ (Type-safe)          │
                        └──────────────────────┘
                                    │
                                    ▼
                        ┌──────────────────────┐
                        │   Backend API        │
                        │ /api/v1/results/     │
                        └──────────────────────┘
```

---

## Data Flow

### Teacher Workflow
```
┌─────────────────────────────────────────────────────────────────┐
│                      TEACHER WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

    Teacher Login
         │
         ▼
    /results-unified
         │
         ▼
    Route checks role = "teacher"
         │
         ▼
    Render TeacherResultsStrict
         │
         ▼
    Load results (getResults)
         │
         ▼
    Backend returns: id, student_name, course_title, year, semester, raw_score
         │
         ▼
    Display 4-column table
    ├─ Student
    ├─ Course
    ├─ Score (editable)
    └─ Actions
         │
         ▼
    Teacher edits score
         │
         ▼
    Click Save (updateResultScore)
         │
         ▼
    Score saved
         │
         ▼
    Click Submit (submitResult)
         │
         ▼
    Confirmation dialog
         │
         ▼
    Result locked
         │
         ▼
    System calculates grade automatically
```

### Student Workflow
```
┌─────────────────────────────────────────────────────────────────┐
│                      STUDENT WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘

    Student Login
         │
         ▼
    /results-unified
         │
         ▼
    Route checks role = "student"
         │
         ▼
    Render StudentResultsStrict
         │
         ▼
    Load results (getResults)
         │
         ▼
    Backend returns: id, course_title, course_teacher, year, semester,
                     raw_score, grade_letter, gpa, pass_fail
         │
         ▼
    Display 7-column table
    ├─ Course
    ├─ Score
    ├─ Grade (computed)
    ├─ GPA (computed)
    ├─ Status
    ├─ Period
    └─ Appeal
         │
         ▼
    Student views results (read-only)
         │
         ├─ Filter by year (optional)
         │
         ├─ Filter by semester (optional)
         │
         └─ Click Appeal button (optional)
                │
                ▼
            Appeal dialog
                │
                ▼
            Enter reason
                │
                ▼
            Submit appeal (createGradeAppeal)
                │
                ▼
            Appeal submitted
                │
                ▼
            Teacher reviews
                │
                ▼
            Admin approves/rejects
```

### Admin Workflow
```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

    Admin Login
         │
         ▼
    /results-unified
         │
         ▼
    Route checks role = "admin"
         │
         ▼
    Render AdminResultsStrict
         │
         ▼
    Load results (getResults)
         │
         ▼
    Backend returns: ALL fields including status, submitted_at,
                     approved_at, unlocked_at, created_at, updated_at
         │
         ▼
    Display 7+ column table
    ├─ Student
    ├─ Course
    ├─ Score
    ├─ Grade
    ├─ GPA
    ├─ Status
    └─ Actions
         │
         ├─ Approve button (for submitted)
         │      │
         │      ▼
         │  approveResult()
         │      │
         │      ▼
         │  Result approved
         │
         ├─ Unlock button (for non-draft)
         │      │
         │      ▼
         │  unlockResult()
         │      │
         │      ▼
         │  Result unlocked
         │
         ├─ Audit log button
         │      │
         │      ▼
         │  getResultAuditLog()
         │      │
         │      ▼
         │  Show audit log dialog
         │
         └─ Grading Scales tab
                │
                ▼
            View scales
                │
                ├─ Create new scale
                │
                ├─ Edit scale
                │
                └─ View rules
```

---

## Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                          │
└─────────────────────────────────────────────────────────────────┘

ResultsUnifiedPage
├─ Check user.role
├─ If teacher → TeacherResultsStrict
│   ├─ Header
│   ├─ Stats (Total, With Scores, Pending)
│   ├─ Info Banner
│   ├─ Results Table
│   │   ├─ Student column
│   │   ├─ Course column
│   │   ├─ Score column (editable)
│   │   └─ Actions column
│   └─ Submit Dialog
│
├─ If student → StudentResultsStrict
│   ├─ Header
│   ├─ Stats (Total Courses, Avg GPA, Passed, Failed)
│   ├─ Filters (Year, Semester)
│   ├─ Results Table
│   │   ├─ Course column
│   │   ├─ Score column
│   │   ├─ Grade column
│   │   ├─ GPA column
│   │   ├─ Status column
│   │   ├─ Period column
│   │   └─ Appeal column
│   └─ Appeal Dialog
│
└─ If admin → AdminResultsStrict
    ├─ Header
    ├─ Stats (Total, Draft, Submitted, Approved, Active Scale)
    ├─ Tabs
    │   ├─ Results Tab
    │   │   ├─ Results Table
    │   │   │   ├─ Student column
    │   │   │   ├─ Course column
    │   │   │   ├─ Score column
    │   │   │   ├─ Grade column
    │   │   │   ├─ GPA column
    │   │   │   ├─ Status column
    │   │   │   └─ Actions column
    │   │   └─ Audit Log Dialog
    │   │
    │   └─ Grading Scales Tab
    │       ├─ New Scale button
    │       ├─ Scales list
    │       │   ├─ Scale name
    │       │   ├─ Rules count
    │       │   ├─ Active badge
    │       │   ├─ Edit button
    │       │   └─ Rules display
    │       └─ Rules list
```

---

## Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA MODELS                                │
└─────────────────────────────────────────────────────────────────┘

StudentResult
├─ id
├─ student (FK)
├─ course (FK)
├─ year
├─ semester
├─ raw_score (0-100)
├─ status (draft, submitted, approved, unlocked)
├─ submitted_at
├─ submitted_by (FK)
├─ approved_at
├─ approved_by (FK)
├─ unlocked_at
├─ unlocked_by (FK)
├─ created_at
└─ updated_at

GradingScale
├─ id
├─ name
├─ is_active
├─ created_by (FK)
├─ created_at
└─ updated_at
    └─ rules (many)
        ├─ id
        ├─ letter (A+, A, B+, etc.)
        ├─ min_score
        ├─ max_score
        ├─ gpa_points
        └─ pass_fail

ResultAuditLog
├─ id
├─ result (FK)
├─ action
├─ performed_by (FK)
├─ performed_by_role
├─ old_value
├─ new_value
├─ note
└─ timestamp

GradeAppeal
├─ id
├─ result (FK)
├─ student (FK)
├─ reason
├─ status (pending, reviewed, escalated, approved, rejected)
├─ teacher_response
├─ teacher_reviewed_by (FK)
├─ teacher_reviewed_at
├─ override_score
├─ override_reason
├─ override_by (FK)
├─ override_at
├─ created_at
└─ updated_at
```

---

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                              │
└─────────────────────────────────────────────────────────────────┘

Results
├─ GET    /api/v1/results/                    (List results)
├─ GET    /api/v1/results/{id}/               (Get detail)
├─ PATCH  /api/v1/results/{id}/               (Update score)
├─ POST   /api/v1/results/{id}/submit/        (Submit & lock)
├─ POST   /api/v1/results/{id}/approve/       (Admin approve)
├─ POST   /api/v1/results/{id}/unlock/        (Admin unlock)
└─ GET    /api/v1/results/audit_log/          (View audit trail)

Grading Scales
├─ GET    /api/v1/results/grading-scales/     (List scales)
├─ POST   /api/v1/results/grading-scales/     (Create scale)
├─ PATCH  /api/v1/results/grading-scales/{id}/ (Update scale)
└─ DELETE /api/v1/results/grading-scales/{id}/ (Delete scale)

Grade Appeals
├─ GET    /api/v1/results/appeals/            (List appeals)
├─ POST   /api/v1/results/appeals/            (Create appeal)
├─ POST   /api/v1/results/appeals/{id}/review/ (Review appeal)
└─ POST   /api/v1/results/appeals/{id}/override/ (Override grade)
```

---

## Type System

```
┌─────────────────────────────────────────────────────────────────┐
│                      TYPE DEFINITIONS                           │
└─────────────────────────────────────────────────────────────────┘

TeacherResult (6 fields)
├─ id
├─ student_name
├─ course_title
├─ year
├─ semester
└─ raw_score

StudentResult (9 fields)
├─ id
├─ course_title
├─ course_teacher
├─ year
├─ semester
├─ raw_score
├─ grade_letter (computed)
├─ gpa (computed)
└─ pass_fail (computed)

AdminResult (20+ fields)
├─ id
├─ student
├─ student_detail
├─ course
├─ course_title
├─ course_teacher
├─ year
├─ semester
├─ raw_score
├─ grade_letter (computed)
├─ gpa (computed)
├─ pass_fail (computed)
├─ status
├─ submitted_at
├─ submitted_by
├─ approved_at
├─ approved_by
├─ unlocked_at
├─ unlocked_by
├─ created_at
└─ updated_at
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
└─────────────────────────────────────────────────────────────────┘

Frontend Layer
├─ Role-based routing
├─ Separate components per role
├─ Different table structures
├─ Type-safe API client
└─ No hidden columns

API Layer
├─ Authentication required
├─ Role-based permissions
├─ Query filtering by role
└─ Serializer-level field exposure

Backend Layer
├─ TeacherResultSerializer (6 fields, no grades)
├─ StudentResultSerializer (9 fields, with grades)
├─ AdminResultSerializer (20+ fields, all data)
├─ get_queryset() filtering
├─ get_serializer_class() selection
└─ Permission checks

Database Layer
├─ Unique constraints
├─ Immutable audit log
├─ Computed grades (never stored)
└─ Locked records
```

---

## Status Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                      STATUS WORKFLOW                            │
└─────────────────────────────────────────────────────────────────┘

    DRAFT
      │
      │ Teacher submits
      ▼
    SUBMITTED (locked)
      │
      ├─ Admin approves
      │      ▼
      │    APPROVED
      │      │
      │      └─ Admin unlocks
      │             ▼
      │          UNLOCKED
      │             │
      │             └─ Teacher edits & resubmits
      │                    ▼
      │                 SUBMITTED
      │
      └─ Admin unlocks
             ▼
          UNLOCKED
             │
             └─ Teacher edits & resubmits
                    ▼
                 SUBMITTED
```

---

## Grade Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                      GRADE CALCULATION                          │
└─────────────────────────────────────────────────────────────────┘

Raw Score (0-100)
      │
      ▼
Fetch Active GradingScale
      │
      ▼
Find Matching Rule
├─ A+: 95-100 → GPA 4.0, Pass
├─ A:  90-94.99 → GPA 4.0, Pass
├─ B+: 85-89.99 → GPA 3.3, Pass
├─ B:  80-84.99 → GPA 3.0, Pass
├─ C+: 75-79.99 → GPA 2.7, Pass
├─ C:  70-74.99 → GPA 2.3, Pass
├─ D:  60-69.99 → GPA 1.0, Pass
└─ F:  0-59.99 → GPA 0.0, Fail
      │
      ▼
Return Computed Grade
├─ grade_letter
├─ gpa
└─ pass_fail
```

---

