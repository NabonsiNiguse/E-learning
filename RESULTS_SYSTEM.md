# Role-Based Results System — Complete Implementation Guide

## Overview

A comprehensive, secure results management system with strong data integrity, role-based access control, and immutable audit logging. The system enforces separation of concerns: teachers enter scores, grades are computed automatically, and admins manage the grading rules and approvals.

## Architecture

### Backend (Django)

**Models** (`backend/results/models.py`):
- **GradingScale**: Official letter-grade thresholds (admin-managed only)
- **GradingRule**: Individual grade bands (A+, A, B+, etc.) with GPA points
- **StudentResult**: Core result record with raw scores only
- **ResultAuditLog**: Immutable append-only log of all mutations
- **GradeAppeal**: Student appeals with teacher review and admin override

**Key Design Principles**:
1. **Raw scores stored separately from computed grades** — teachers can only edit `raw_score` (0–100)
2. **Grades computed automatically** — derived from active GradingScale on read, never stored directly
3. **Immutable audit trail** — every action (create, edit, submit, approve, unlock) logged
4. **Locked records** — after submission, only admin can unlock for correction
5. **Unique constraints** — prevent duplicate results per student/course/year/semester
6. **Role-based access** — enforced at API level, not just UI

### Frontend (React)

**Components**:
- **StudentResults** (`frontend/src/components/results/student-results.tsx`)
  - Read-only results table
  - Filter by year and semester
  - Shows course, score, grade, GPA, pass/fail status
  
- **TeacherResults** (`frontend/src/components/results/teacher-results.tsx`)
  - Editable score entry for assigned students
  - Score validation (0–100)
  - Submit button to lock results
  - Grades/GPA shown as read-only computed fields
  
- **AdminResults** (`frontend/src/components/results/admin-results.tsx`)
  - Full results management
  - Approve submitted results
  - Unlock results for correction
  - View audit logs
  - Manage grading scales

**Unified Router** (`frontend/src/routes/results-unified.tsx`):
- Routes to appropriate dashboard based on user role
- Single `/results` endpoint with different behavior per role

## API Endpoints

### Results (`/api/v1/results/`)

#### GET `/results/`
Returns results based on user role:
- **Teacher**: students in their courses
- **Student**: own results only
- **Admin**: all results

Query parameters:
- `year`: Filter by academic year
- `semester`: Filter by semester (semester_1, semester_2, summer)
- `status`: Filter by status (draft, submitted, approved, unlocked)
- `page`: Pagination

Response:
```json
{
  "id": 1,
  "student": 5,
  "student_detail": {
    "id": 5,
    "email": "student@example.com",
    "full_name": "John Doe",
    "role": "student"
  },
  "course": 3,
  "course_title": "Modern Web Development",
  "course_teacher": "Jane Smith",
  "year": 2024,
  "semester": "semester_1",
  "raw_score": 85.5,
  "grade_letter": "B+",
  "gpa": 3.3,
  "pass_fail": "pass",
  "status": "submitted",
  "submitted_at": "2024-05-15T10:30:00Z",
  "approved_at": null,
  "created_at": "2024-05-10T08:00:00Z",
  "updated_at": "2024-05-15T10:30:00Z"
}
```

#### PATCH `/results/{id}/`
Update a result. Behavior depends on user role:

**Teacher** (can only update `raw_score`):
```json
{
  "raw_score": 92.0
}
```

**Admin** (full control):
```json
{
  "raw_score": 92.0,
  "status": "draft"
}
```

Validation:
- Score must be 0–100
- Cannot edit locked results (unless admin)
- Teachers cannot set grade, GPA, or status

#### POST `/results/{id}/submit/`
Teacher submits scores — locks the result.

Request: `{}`

Response: Updated result with `status: "submitted"`, `submitted_at`, `submitted_by`

#### POST `/results/{id}/approve/`
Admin approves final results.

Request: `{}`

Response: Updated result with `status: "approved"`, `approved_at`, `approved_by`

#### POST `/results/{id}/unlock/`
Admin unlocks result for correction.

Request: `{}`

Response: Updated result with `status: "unlocked"`, `unlocked_at`, `unlocked_by`

#### GET `/results/audit_log/?result_id={id}`
Get audit log for a result (admin only).

Response:
```json
[
  {
    "id": 1,
    "action": "created",
    "performed_by": 1,
    "performed_by_detail": {
      "id": 1,
      "email": "admin@example.com",
      "full_name": "Admin User"
    },
    "performed_by_role": "admin",
    "old_value": null,
    "new_value": {
      "student_id": 5,
      "course_id": 3,
      "year": 2024,
      "semester": "semester_1",
      "raw_score": null
    },
    "note": "",
    "timestamp": "2024-05-10T08:00:00Z"
  },
  {
    "id": 2,
    "action": "score_set",
    "performed_by": 2,
    "performed_by_detail": {
      "id": 2,
      "email": "teacher@example.com",
      "full_name": "Jane Smith"
    },
    "performed_by_role": "teacher",
    "old_value": {"raw_score": null},
    "new_value": {"raw_score": "85.5"},
    "note": "",
    "timestamp": "2024-05-15T10:30:00Z"
  }
]
```

### Grading Scales (`/api/v1/results/grading-scales/`)

#### GET `/grading-scales/`
Get all grading scales (admin only).

Response:
```json
[
  {
    "id": 1,
    "name": "Standard 2024",
    "is_active": true,
    "rules": [
      {
        "id": 1,
        "letter": "A+",
        "min_score": 95,
        "max_score": 100,
        "gpa_points": 4.0,
        "pass_fail": "pass"
      },
      {
        "id": 2,
        "letter": "A",
        "min_score": 90,
        "max_score": 94.99,
        "gpa_points": 4.0,
        "pass_fail": "pass"
      }
    ],
    "created_by": {
      "id": 1,
      "full_name": "Admin User"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/grading-scales/`
Create grading scale (admin only).

Request:
```json
{
  "name": "Standard 2024",
  "is_active": true,
  "rules": [
    {
      "letter": "A+",
      "min_score": 95,
      "max_score": 100,
      "gpa_points": 4.0,
      "pass_fail": "pass"
    },
    {
      "letter": "A",
      "min_score": 90,
      "max_score": 94.99,
      "gpa_points": 4.0,
      "pass_fail": "pass"
    }
  ]
}
```

#### PATCH `/grading-scales/{id}/`
Update grading scale (admin only).

### Grade Appeals (`/api/v1/results/appeals/`)

#### GET `/appeals/`
Get appeals based on user role:
- **Student**: own appeals
- **Teacher**: appeals for their courses
- **Admin**: all appeals

#### POST `/appeals/`
Create appeal (student only).

Request:
```json
{
  "result": 1,
  "reason": "I believe my score should be higher because..."
}
```

#### POST `/appeals/{id}/review/`
Teacher reviews appeal.

Request:
```json
{
  "teacher_response": "Thank you for your appeal. After reviewing..."
}
```

#### POST `/appeals/{id}/override/`
Admin overrides grade via appeal.

Request:
```json
{
  "override_score": 90.0,
  "override_reason": "Appeal approved due to..."
}
```

## Data Integrity Rules

### 1. Score Validation
- All scores must be 0–100
- Validated on input (serializer level)
- Stored as DecimalField(max_digits=5, decimal_places=2)

### 2. Grade Computation
- Grades computed from active GradingScale on read
- Never stored directly in StudentResult
- Computed via `StudentResult.compute_grade()` method
- Returns: `{letter, gpa, pass_fail}`

### 3. Immutable Audit Log
- Every mutation creates a ResultAuditLog entry
- Never updated or deleted
- Records: action, performer, role, old_value, new_value, timestamp
- Actions: created, score_set, submitted, approved, unlocked, deleted

### 4. Locked Records
- After submission, status becomes "submitted"
- Locked records cannot be edited by teachers
- Only admin can unlock via `/unlock/` endpoint
- Unlocking creates audit log entry

### 5. Unique Constraints
- `unique_together = [('student', 'course', 'year', 'semester')]`
- Prevents duplicate results for same student/course/period

### 6. Role-Based Access
- **Teacher**: Can only edit raw_score for their courses
- **Student**: Can only view own results
- **Admin**: Full access to all data
- Enforced at viewset level via `get_queryset()` and `get_serializer_class()`

## Workflow

### Teacher Workflow
1. Teacher logs in → sees "Score Entry" dashboard
2. Views students in their courses with draft results
3. Enters raw scores (0–100) for each student
4. Grades/GPA computed automatically and shown read-only
5. Clicks "Submit" to lock scores
6. After submission, scores cannot be edited without admin unlock

### Student Workflow
1. Student logs in → sees "My Results" dashboard
2. Views own results in clean table format
3. Can filter by year and semester
4. Sees course, score, grade, GPA, pass/fail status (all read-only)
5. Can appeal grade if needed

### Admin Workflow
1. Admin logs in → sees "Results Management" dashboard
2. **Results Tab**:
   - Views all results across all courses
   - Approves submitted results
   - Unlocks results for correction
   - Views audit logs for any result
3. **Grading Scales Tab**:
   - Creates/updates grading scales
   - Sets active scale (only one active at a time)
   - Defines grade bands and GPA points

## Security Considerations

### Backend Enforcement
- All role checks enforced at API level via `get_queryset()` and permission checks
- Teachers cannot access students outside their courses
- Students cannot access other students' results
- Admins have full access

### Score Validation
- Scores validated 0–100 on input
- Decimal validation prevents invalid data
- Serializer-level validation before database write

### Audit Trail
- Every mutation logged immutably
- Includes performer, role, timestamp, old/new values
- Enables forensic analysis of any changes

### Locked Records
- Submitted results locked from teacher editing
- Only admin can unlock
- Unlock action logged

## Frontend Implementation

### API Client (`frontend/src/lib/api-results.ts`)
- `getResults(params)` — get results with filtering
- `updateResultScore(resultId, rawScore)` — teacher updates score
- `submitResult(resultId)` — teacher submits and locks
- `approveResult(resultId)` — admin approves
- `unlockResult(resultId)` — admin unlocks
- `getResultAuditLog(resultId)` — get audit trail
- `getGradingScales()` — get all scales
- `createGradingScale(data)` — create scale
- `getGradeAppeals()` — get appeals

### Components
- **StudentResults**: Read-only results table with filtering
- **TeacherResults**: Editable score entry with submit workflow
- **AdminResults**: Full control panel with approvals and grading management

### Unified Router
- Single `/results` route
- Routes to appropriate component based on `user.role`
- Handles authentication check

## Testing Checklist

### Backend
- [ ] Teacher can only view students in their courses
- [ ] Teacher can only edit raw_score
- [ ] Teacher cannot set grade/GPA/status
- [ ] Teacher can submit to lock results
- [ ] Student can only view own results
- [ ] Admin can view all results
- [ ] Admin can approve submitted results
- [ ] Admin can unlock results
- [ ] Audit log created for all mutations
- [ ] Scores validated 0–100
- [ ] Duplicate results prevented
- [ ] Grades computed correctly from GradingScale
- [ ] Only one active GradingScale at a time

### Frontend
- [ ] Student sees read-only results table
- [ ] Student can filter by year/semester
- [ ] Teacher sees editable score table
- [ ] Teacher can edit scores and submit
- [ ] Teacher sees grades/GPA as read-only
- [ ] Admin sees all results
- [ ] Admin can approve/unlock results
- [ ] Admin can view audit logs
- [ ] Admin can manage grading scales
- [ ] Proper error handling and toast notifications
- [ ] Loading states work correctly

## Example Grading Scale

```json
{
  "name": "Standard 2024",
  "is_active": true,
  "rules": [
    {"letter": "A+", "min_score": 95, "max_score": 100, "gpa_points": 4.0, "pass_fail": "pass"},
    {"letter": "A",  "min_score": 90, "max_score": 94.99, "gpa_points": 4.0, "pass_fail": "pass"},
    {"letter": "B+", "min_score": 85, "max_score": 89.99, "gpa_points": 3.3, "pass_fail": "pass"},
    {"letter": "B",  "min_score": 80, "max_score": 84.99, "gpa_points": 3.0, "pass_fail": "pass"},
    {"letter": "C+", "min_score": 75, "max_score": 79.99, "gpa_points": 2.3, "pass_fail": "pass"},
    {"letter": "C",  "min_score": 70, "max_score": 74.99, "gpa_points": 2.0, "pass_fail": "pass"},
    {"letter": "D",  "min_score": 60, "max_score": 69.99, "gpa_points": 1.0, "pass_fail": "pass"},
    {"letter": "F",  "min_score": 0,  "max_score": 59.99, "gpa_points": 0.0, "pass_fail": "fail"}
  ]
}
```

## Troubleshooting

### Issue: Teacher cannot see students
**Solution**: Verify teacher is assigned to the course. Check `course.teacher` field.

### Issue: Grades not showing
**Solution**: Ensure active GradingScale exists. Check `GradingScale.is_active = True`.

### Issue: Cannot submit result
**Solution**: Ensure raw_score is set (not null). Status must be "draft".

### Issue: Cannot unlock result
**Solution**: Only admin can unlock. Ensure user role is "admin" or "super_admin".

### Issue: Audit log not showing
**Solution**: Check ResultAuditLog table. Ensure result_id is correct.

## Future Enhancements

1. **Bulk score import** — CSV upload for teachers
2. **Grade distribution charts** — visualize class performance
3. **Automated appeals** — flag outliers for review
4. **Email notifications** — notify students of approvals
5. **Export to transcript** — generate official transcripts
6. **Historical grading scales** — track scale changes over time
7. **Weighted grades** — support assignment/quiz/exam weights
8. **Curve grading** — apply class-wide adjustments
