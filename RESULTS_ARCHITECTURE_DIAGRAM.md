# Results System — Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESULTS MANAGEMENT SYSTEM                       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React)                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    /results-unified Route                       │   │
│  │  (Role-based routing to appropriate dashboard)                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │ StudentResults   │  │ TeacherResults   │  │ AdminResults     │     │
│  │ (Read-only)      │  │ (Score Entry)    │  │ (Full Control)   │     │
│  │                  │  │                  │  │                  │     │
│  │ • View results   │  │ • Enter scores   │  │ • Approve        │     │
│  │ • Filter by      │  │ • Submit to lock │  │ • Unlock         │     │
│  │   year/semester  │  │ • View computed  │  │ • View audit log │     │
│  │ • See grade,     │  │   grades (RO)    │  │ • Manage scales  │     │
│  │   GPA, pass/fail │  │                  │  │                  │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              API Client (frontend/src/lib/api-results.ts)       │   │
│  │  • getResults()  • updateResultScore()  • submitResult()       │   │
│  │  • approveResult()  • unlockResult()  • getResultAuditLog()    │   │
│  │  • getGradingScales()  • getGradeAppeals()                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
                            HTTP/REST API
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Django)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    /api/v1/results/ Endpoint                    │   │
│  │  (Unified endpoint with role-based behavior)                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                      ResultsViewSet                           │      │
│  │  ┌────────────────────────────────────────────────────────┐  │      │
│  │  │ get_queryset()                                         │  │      │
│  │  │ • Teacher: students in their courses                  │  │      │
│  │  │ • Student: own results only                           │  │      │
│  │  │ • Admin: all results                                  │  │      │
│  │  └────────────────────────────────────────────────────────┘  │      │
│  │  ┌────────────────────────────────────────────────────────┐  │      │
│  │  │ get_serializer_class()                                 │  │      │
│  │  │ • Teacher: TeacherScoreWriteSerializer (raw_score)    │  │      │
│  │  │ • Student: StudentResultSerializer (read-only)        │  │      │
│  │  │ • Admin: AdminResultWriteSerializer (full control)    │  │      │
│  │  └────────────────────────────────────────────────────────┘  │      │
│  │  ┌────────────────────────────────────────────────────────┐  │      │
│  │  │ Actions                                                │  │      │
│  │  │ • submit() → Lock result                              │  │      │
│  │  │ • approve() → Approve result                          │  │      │
│  │  │ • unlock() → Unlock for correction                    │  │      │
│  │  │ • audit_log() → View audit trail                      │  │      │
│  │  └────────────────────────────────────────────────────────┘  │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                   GradingScaleViewSet                         │      │
│  │  • Admin only                                                │      │
│  │  • Create/update grading scales                             │      │
│  │  • Manage grade bands and GPA points                        │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                   GradeAppealViewSet                          │      │
│  │  • Students create appeals                                  │      │
│  │  • Teachers review appeals                                  │      │
│  │  • Admins override grades                                   │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                            DATABASE (SQLite)                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ GradingScale                                                 │      │
│  │ • id, name, is_active, created_by, created_at, updated_at  │      │
│  │ • Only one active scale at a time                           │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ GradingRule                                                  │      │
│  │ • id, scale_id, letter, min_score, max_score, gpa_points   │      │
│  │ • pass_fail (pass/fail)                                     │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ StudentResult                                                │      │
│  │ • id, student_id, course_id, year, semester                │      │
│  │ • raw_score (0-100, only field teachers can edit)          │      │
│  │ • status (draft, submitted, approved, unlocked)            │      │
│  │ • submitted_at, submitted_by, approved_at, approved_by     │      │
│  │ • unlocked_at, unlocked_by                                 │      │
│  │ • UNIQUE(student, course, year, semester)                  │      │
│  │ • Indexes: year, semester, status                          │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ ResultAuditLog (Immutable)                                   │      │
│  │ • id, result_id, action, performed_by, performed_by_role   │      │
│  │ • old_value (JSON), new_value (JSON), note                 │      │
│  │ • timestamp (auto_now_add)                                 │      │
│  │ • Actions: created, score_set, submitted, approved,        │      │
│  │   unlocked, deleted                                        │      │
│  │ • Indexes: result_id, timestamp                            │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ GradeAppeal                                                  │      │
│  │ • id, result_id, student_id, reason, status                │      │
│  │ • teacher_response, teacher_reviewed_by, teacher_reviewed_at│      │
│  │ • override_score, override_reason, override_by, override_at│      │
│  │ • UNIQUE(result, student)                                  │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Teacher Workflow
```
Teacher Login
    ↓
View Score Entry Dashboard
    ↓
Enter Raw Score (0-100)
    ↓
Grade Computed Automatically
    ↓
Click Submit
    ↓
Result Locked (status: submitted)
    ↓
Audit Log Entry Created
    ↓
Admin Notified
```

### Student Workflow
```
Student Login
    ↓
View My Results Dashboard
    ↓
Filter by Year/Semester
    ↓
View Results (Read-Only)
    ├─ Course Name
    ├─ Raw Score
    ├─ Grade Letter (computed)
    ├─ GPA (computed)
    └─ Pass/Fail (computed)
    ↓
Can Appeal Grade (optional)
```

### Admin Workflow
```
Admin Login
    ↓
View Results Management Dashboard
    ↓
├─ Results Tab
│  ├─ View All Results
│  ├─ Approve Submitted Results
│  ├─ Unlock Results for Correction
│  └─ View Audit Logs
│
└─ Grading Scales Tab
   ├─ Create Grading Scale
   ├─ Update Grade Bands
   ├─ Set Active Scale
   └─ Manage GPA Points
```

## Role-Based Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS MATRIX                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Action                  │ Teacher │ Student │ Admin             │
│ ─────────────────────────┼─────────┼─────────┼──────            │
│ View own results        │    ✓    │    ✓    │   ✓              │
│ View students' results  │ ✓(own)  │    ✗    │   ✓              │
│ Edit raw_score          │ ✓(draft)│    ✗    │   ✓              │
│ Edit grade/GPA          │    ✗    │    ✗    │   ✗              │
│ Submit result           │    ✓    │    ✗    │   ✗              │
│ Approve result          │    ✗    │    ✗    │   ✓              │
│ Unlock result           │    ✗    │    ✗    │   ✓              │
│ View audit log          │    ✗    │    ✗    │   ✓              │
│ Manage grading scales   │    ✗    │    ✗    │   ✓              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Grade Computation Flow

```
Raw Score (0-100)
    ↓
Query Active GradingScale
    ↓
Find Matching GradingRule
    ├─ min_score ≤ raw_score ≤ max_score
    ↓
Extract Grade Data
    ├─ letter (A+, A, B+, etc.)
    ├─ gpa_points (4.0, 3.3, 3.0, etc.)
    └─ pass_fail (pass/fail)
    ↓
Return Computed Grade
    (Never stored, always computed on read)
```

## Audit Trail Flow

```
Any Mutation (create, update, submit, approve, unlock)
    ↓
Capture Old State
    ↓
Perform Mutation
    ↓
Capture New State
    ↓
Create ResultAuditLog Entry
    ├─ action (created, score_set, submitted, etc.)
    ├─ performed_by (user)
    ├─ performed_by_role (teacher, student, admin)
    ├─ old_value (JSON)
    ├─ new_value (JSON)
    ├─ note (optional)
    └─ timestamp (auto_now_add)
    ↓
Log Stored Immutably
    (Never updated or deleted)
```

## Data Integrity Enforcement

```
┌─────────────────────────────────────────────────────────────────┐
│                  DATA INTEGRITY ENFORCEMENT                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Score Validation                                            │
│    Input → Serializer → Validate 0-100 → Database             │
│                                                                 │
│ 2. Grade Computation                                           │
│    Raw Score → GradingScale → Compute Grade → Return          │
│    (Never stored, always computed)                            │
│                                                                 │
│ 3. Unique Constraints                                          │
│    UNIQUE(student, course, year, semester)                    │
│    Prevents duplicate results                                 │
│                                                                 │
│ 4. Locked Records                                              │
│    Status: submitted/approved → Cannot edit (except admin)    │
│                                                                 │
│ 5. Immutable Audit Log                                         │
│    Every mutation logged → Never updated/deleted              │
│                                                                 │
│ 6. Single Active Scale                                         │
│    Only one GradingScale.is_active = True                     │
│                                                                 │
│ 7. Role-Based Access                                           │
│    All checks at API level (not just UI)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Result Status Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESULT STATUS TRANSITIONS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                          ┌─────────┐                           │
│                          │  DRAFT  │                           │
│                          └────┬────┘                           │
│                               │                               │
│                    Teacher enters score                       │
│                               │                               │
│                               ↓                               │
│                          ┌─────────┐                           │
│                          │SUBMITTED│                           │
│                          └────┬────┘                           │
│                               │                               │
│                    Admin approves or unlocks                  │
│                               │                               │
│                ┌──────────────┼──────────────┐               │
│                ↓                              ↓               │
│           ┌─────────┐                   ┌─────────┐          │
│           │APPROVED │                   │UNLOCKED │          │
│           └─────────┘                   └────┬────┘          │
│                                              │               │
│                                   Teacher re-enters score    │
│                                              │               │
│                                              ↓               │
│                                         ┌─────────┐          │
│                                         │SUBMITTED│          │
│                                         └─────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────────┐
│                    COMPONENT INTERACTION                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  StudentResults ←→ API Client ←→ Backend ViewSet ←→ Database   │
│  TeacherResults ←→ API Client ←→ Backend ViewSet ←→ Database   │
│  AdminResults   ←→ API Client ←→ Backend ViewSet ←→ Database   │
│                                                                  │
│  All components use same API endpoints                          │
│  Role-based behavior enforced at backend                        │
│  Frontend components are role-specific UI only                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Frontend (UI-level checks)                                      │
│    ↓                                                            │
│ API Client (Type checking)                                      │
│    ↓                                                            │
│ Backend (ENFORCED)                                              │
│    ├─ Authentication (JWT)                                      │
│    ├─ Authorization (Role checks)                               │
│    ├─ get_queryset() (Filter by role)                          │
│    ├─ get_serializer_class() (Role-specific serializers)       │
│    ├─ Validation (Score 0-100)                                 │
│    └─ Audit Logging (All mutations)                            │
│    ↓                                                            │
│ Database (Constraints)                                          │
│    ├─ UNIQUE constraints                                        │
│    ├─ Foreign key constraints                                   │
│    └─ Indexes for performance                                   │
│                                                                  │
│ All security checks at backend level                            │
│ Frontend cannot bypass security                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2024
