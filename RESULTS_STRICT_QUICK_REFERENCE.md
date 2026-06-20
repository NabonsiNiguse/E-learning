# Results System — Strict Role-Based Quick Reference

## What Each Role Sees

### 👨‍🏫 Teacher Dashboard
**URL:** `/results-unified`

**Table Columns:**
```
Student | Course | Score (0–100) | Actions
```

**What Teachers See:**
- ✅ Student names
- ✅ Course titles
- ✅ Raw scores (editable)
- ✅ Submit button

**What Teachers CANNOT See:**
- ❌ Grades
- ❌ GPA
- ❌ Final scores
- ❌ Status
- ❌ Submission details

**Actions:**
- Edit score (0-100)
- Submit to lock
- Cannot edit after submission

---

### 👨‍🎓 Student Dashboard
**URL:** `/results-unified`

**Table Columns:**
```
Course | Score | Grade | GPA | Status | Period
```

**What Students See:**
- ✅ Course titles
- ✅ Final scores
- ✅ Grade letters (A+, A, B+, etc.)
- ✅ GPA points (4.0, 3.3, 3.0, etc.)
- ✅ Pass/fail status
- ✅ Year and semester

**What Students CANNOT See:**
- ❌ Other students' results
- ❌ Submission status
- ❌ Approval status
- ❌ Audit logs
- ❌ Grading rules

**Actions:**
- Filter by year
- Filter by semester
- Export results
- View only (read-only)

---

### 👨‍💼 Admin Dashboard
**URL:** `/results-unified`

**Table Columns:**
```
Student | Course | Score | Grade | GPA | Status | Actions
```

**What Admins See:**
- ✅ All student information
- ✅ All course information
- ✅ Raw scores
- ✅ Computed grades
- ✅ GPA points
- ✅ Pass/fail status
- ✅ Submission status
- ✅ Approval status
- ✅ Unlock status
- ✅ Audit logs
- ✅ Grading rules

**What Admins Can Do:**
- ✅ View all results
- ✅ Approve submitted results
- ✅ Unlock results for correction
- ✅ View audit logs
- ✅ Manage grading scales
- ✅ Create new scales
- ✅ Edit grade bands

---

## Backend API Responses

### Teacher Request
```bash
GET /api/v1/results/
Authorization: Bearer <teacher_token>
```

**Response:**
```json
{
  "id": 1,
  "student_name": "John Doe",
  "course_title": "Math 101",
  "year": 2024,
  "semester": "semester_1",
  "raw_score": 85.5
}
```

### Student Request
```bash
GET /api/v1/results/
Authorization: Bearer <student_token>
```

**Response:**
```json
{
  "id": 1,
  "course_title": "Math 101",
  "course_teacher": "Jane Smith",
  "year": 2024,
  "semester": "semester_1",
  "raw_score": 85.5,
  "grade_letter": "B+",
  "gpa": 3.3,
  "pass_fail": "pass"
}
```

### Admin Request
```bash
GET /api/v1/results/
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "id": 1,
  "student": 5,
  "student_detail": {
    "id": 5,
    "email": "john@example.com",
    "full_name": "John Doe"
  },
  "course": 3,
  "course_title": "Math 101",
  "course_teacher": "Jane Smith",
  "year": 2024,
  "semester": "semester_1",
  "raw_score": 85.5,
  "grade_letter": "B+",
  "gpa": 3.3,
  "pass_fail": "pass",
  "status": "submitted",
  "submitted_at": "2024-05-15T10:30:00Z",
  "submitted_by": 2,
  "approved_at": null,
  "approved_by": null,
  "unlocked_at": null,
  "unlocked_by": null,
  "created_at": "2024-05-10T08:00:00Z",
  "updated_at": "2024-05-15T10:30:00Z"
}
```

---

## Data Integrity Rules

### 1. Grades Computed ONLY in Backend
- ✅ Grades NEVER stored in database
- ✅ Always computed from GradingScale
- ✅ Computed on read, not write

### 2. Teachers NEVER See or Edit Grades
- ✅ Backend rejects grade field in requests
- ✅ Only raw_score field accepted
- ✅ Serializer enforces this

### 3. Score Validation (0–100)
- ✅ Scores < 0 rejected
- ✅ Scores > 100 rejected
- ✅ Null allowed (not yet entered)

### 4. Locked Records After Submission
- ✅ After submission, status = "submitted"
- ✅ Teachers cannot edit locked results
- ✅ Only admin can unlock

### 5. Separate Storage: Scores vs Grades
- ✅ `raw_score` stored in database
- ✅ `grade_letter`, `gpa`, `pass_fail` computed on read
- ✅ No grade columns in database

---

## Files

### Backend
- `backend/results/serializers.py` — Role-based serializers
- `backend/results/views.py` — Strict serializer selection

### Frontend
- `frontend/src/components/results/teacher-results-strict.tsx` — Teacher dashboard
- `frontend/src/components/results/student-results-strict.tsx` — Student dashboard
- `frontend/src/components/results/admin-results-strict.tsx` — Admin dashboard
- `frontend/src/lib/api-results-strict.ts` — API client with role-specific types
- `frontend/src/routes/results-unified.tsx` — Unified route

---

## Key Points

### ✅ Backend Enforcement
- Role-specific serializers
- Different fields per role
- Unauthorized fields NEVER included
- Backend blocks unauthorized writes

### ✅ Frontend Enforcement
- Different components per role
- Different table structures per role
- No hidden columns (not just CSS)
- Type-safe API client

### ✅ Data Integrity
- Grades computed, never stored
- Teachers NEVER see grades
- Scores validated 0–100
- Locked records prevent changes
- Audit log records all mutations

### ✅ Security
- All role checks at API level
- Not just UI hiding
- Backend enforces field exposure
- Type-safe data structures

---

## Testing

### Teacher
1. Login as teacher
2. Go to `/results-unified`
3. See only: Student, Course, Score, Actions
4. Edit score (0-100)
5. Click Submit
6. Score locked

### Student
1. Login as student
2. Go to `/results-unified`
3. See only: Course, Score, Grade, GPA, Status, Period
4. Filter by year/semester
5. View only (read-only)

### Admin
1. Login as admin
2. Go to `/results-unified`
3. See all columns
4. Approve submitted results
5. Unlock results
6. View audit logs

---

## Summary

**Each role sees a COMPLETELY DIFFERENT table:**

| Role | Columns | Editable | Can See Grades |
|------|---------|----------|----------------|
| Teacher | 4 | Yes | ❌ No |
| Student | 6 | No | ✅ Yes (own) |
| Admin | 7+ | Yes | ✅ Yes (all) |

**Backend enforces field exposure at serializer level.**
**Frontend shows different table structures per role.**
**Grades computed only in backend, never stored.**
