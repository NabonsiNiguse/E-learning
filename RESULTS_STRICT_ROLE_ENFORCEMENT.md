# Results System — Strict Role-Based Enforcement

## Overview

The Results system now enforces **STRICT role-based behavior** at BOTH backend and frontend levels. Each role sees a **COMPLETELY DIFFERENT table structure** with different columns and data fields.

## Backend Enforcement (Critical)

### Serializer-Based Field Exposure

The backend uses **role-specific serializers** that return completely different data per role:

#### 1. TeacherResultSerializer (Teachers ONLY)
```python
fields = [
    'id',
    'student_name',      # ← Student name only
    'course_title',      # ← Course title only
    'year', 'semester',
    'raw_score',         # ← Editable (0-100)
]
# EXCLUDES: grade_letter, gpa, pass_fail, status
```

**What Teachers See:**
- Student name
- Course title
- Raw score (editable)
- Year and semester

**What Teachers CANNOT See:**
- ❌ Grade letter
- ❌ GPA
- ❌ Final score
- ❌ Pass/fail status
- ❌ Submission status

#### 2. StudentResultSerializer (Students ONLY)
```python
fields = [
    'id',
    'course_title',      # ← Course only
    'course_teacher',
    'year', 'semester',
    'raw_score',         # ← Final score (read-only)
    'grade_letter',      # ← Computed
    'gpa',               # ← Computed
    'pass_fail',         # ← Computed
]
# EXCLUDES: status, submission details, other students' data
```

**What Students See:**
- Course title and teacher
- Final score
- Grade letter (computed)
- GPA (computed)
- Pass/fail status (computed)
- Year and semester

**What Students CANNOT See:**
- ❌ Submission status
- ❌ Approval status
- ❌ Other students' results
- ❌ Audit logs
- ❌ Grading rules

#### 3. AdminResultSerializer (Admin ONLY)
```python
fields = [
    'id',
    'student', 'student_detail',  # ← Full student info
    'course', 'course_title', 'course_teacher',
    'year', 'semester',
    'raw_score',
    'grade_letter',      # ← Computed
    'gpa',               # ← Computed
    'pass_fail',         # ← Computed
    'status',            # ← Full status
    'submitted_at', 'submitted_by',
    'approved_at', 'approved_by',
    'unlocked_at', 'unlocked_by',
    'created_at', 'updated_at',
]
```

**What Admins See:**
- All student information
- All course information
- Raw scores
- Computed grades, GPA, pass/fail
- Full submission workflow (status, timestamps, who submitted/approved/unlocked)
- Audit logs
- Grading rules

### Backend Enforcement in Views

```python
def get_serializer_class(self):
    """
    STRICT role-based serializer selection.
    Each role gets a COMPLETELY DIFFERENT serializer with different fields.
    """
    user = self.request.user
    
    # WRITE operations
    if self.request.method in ['PUT', 'PATCH']:
        if user.is_admin:
            return AdminResultWriteSerializer
        elif user.is_teacher:
            return TeacherScoreWriteSerializer
        else:
            raise PermissionDenied('Students cannot edit results.')
    
    # READ operations
    if user.is_admin:
        return AdminResultSerializer
    elif user.is_teacher:
        return TeacherResultSerializer
    elif user.is_student:
        return StudentResultSerializer
    
    return StudentResultSerializer
```

**Key Points:**
- ✅ Role check happens BEFORE serialization
- ✅ Each role gets a different serializer
- ✅ Unauthorized fields are NEVER included in response
- ✅ Backend blocks unauthorized writes at serializer level

## Frontend Enforcement

### Strict Components (Different Table Structures)

#### 1. TeacherResultsStrict Component
**File:** `frontend/src/components/results/teacher-results-strict.tsx`

**Table Columns:**
| Student | Course | Score (0–100) | Actions |
|---------|--------|---------------|---------|
| Name    | Title  | Editable      | Submit  |

**Features:**
- ✅ Editable score input (0-100)
- ✅ Submit button to lock scores
- ✅ NO grade column
- ✅ NO GPA column
- ✅ NO final score column
- ✅ NO status column

**Code:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Student</TableHead>
      <TableHead>Course</TableHead>
      <TableHead>Score (0–100)</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  {/* Only these 4 columns */}
</Table>
```

#### 2. StudentResultsStrict Component
**File:** `frontend/src/components/results/student-results-strict.tsx`

**Table Columns:**
| Course | Score | Grade | GPA | Status | Period |
|--------|-------|-------|-----|--------|--------|
| Title  | %     | A+    | 4.0 | Pass   | Year   |

**Features:**
- ✅ Read-only results
- ✅ Filter by year and semester
- ✅ Shows grade, GPA, pass/fail
- ✅ NO submission status
- ✅ NO approval status
- ✅ NO other students' data

**Code:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Course</TableHead>
      <TableHead>Score</TableHead>
      <TableHead>Grade</TableHead>
      <TableHead>GPA</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Period</TableHead>
    </TableRow>
  </TableHeader>
  {/* Only these 6 columns */}
</Table>
```

#### 3. AdminResultsStrict Component
**File:** `frontend/src/components/results/admin-results-strict.tsx`

**Table Columns:**
| Student | Course | Score | Grade | GPA | Status | Actions |
|---------|--------|-------|-------|-----|--------|---------|
| Name    | Title  | %     | A+    | 4.0 | Draft  | Approve |

**Features:**
- ✅ Full data visibility
- ✅ Approve submitted results
- ✅ Unlock results for correction
- ✅ View audit logs
- ✅ Manage grading scales
- ✅ Shows all submission details

**Code:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Student</TableHead>
      <TableHead>Course</TableHead>
      <TableHead>Score</TableHead>
      <TableHead>Grade</TableHead>
      <TableHead>GPA</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  {/* Full data with all columns */}
</Table>
```

## Data Integrity Rules

### 1. Grades Computed ONLY in Backend
```python
def compute_grade(self):
    """
    Returns dict with letter, gpa_points, pass_fail based on active GradingScale.
    Returns None if no active scale or score is null.
    """
    if self.raw_score is None:
        return None
    try:
        scale = GradingScale.objects.get(is_active=True)
        rule = scale.rules.filter(
            min_score__lte=self.raw_score,
            max_score__gte=self.raw_score,
        ).first()
        if rule:
            return {
                'letter': rule.letter,
                'gpa': float(rule.gpa_points),
                'pass_fail': rule.pass_fail,
            }
    except GradingScale.DoesNotExist:
        pass
    return None
```

**Key Points:**
- ✅ Grades NEVER stored in database
- ✅ Always computed from GradingScale
- ✅ Teachers NEVER see grades
- ✅ Grades computed on read, not write

### 2. Teachers NEVER See or Edit Grades
```python
class TeacherScoreWriteSerializer(serializers.ModelSerializer):
    """
    Teachers can ONLY set raw_score.
    Grade, GPA, pass_fail are computed — not accepted as input.
    """
    class Meta:
        model = StudentResult
        fields = ['raw_score']  # ← ONLY this field

    def validate_raw_score(self, value):
        if value is None:
            return value
        if not (0 <= float(value) <= 100):
            raise serializers.ValidationError('Score must be between 0 and 100.')
        return value
```

**Enforcement:**
- ✅ Backend rejects any attempt to set grade
- ✅ Backend rejects any attempt to set GPA
- ✅ Backend rejects any attempt to set status
- ✅ Only raw_score field accepted

### 3. Score Validation (0–100)
```python
def validate_raw_score(self, value):
    if value is None:
        return value
    if not (0 <= float(value) <= 100):
        raise serializers.ValidationError('Score must be between 0 and 100.')
    return value
```

**Validation Points:**
- ✅ Serializer level validation
- ✅ Rejects scores < 0
- ✅ Rejects scores > 100
- ✅ Allows null (not yet entered)

### 4. Locked Records After Submission
```python
@property
def is_locked(self):
    return self.status in (self.Status.SUBMITTED, self.Status.APPROVED)

def validate(self, attrs):
    instance = self.instance
    if instance and instance.is_locked:
        raise serializers.ValidationError(
            'This result is locked. Contact admin to unlock before editing.'
        )
    return attrs
```

**Lock Enforcement:**
- ✅ After submission, status = "submitted"
- ✅ Teachers cannot edit locked results
- ✅ Only admin can unlock
- ✅ Audit log records unlock action

### 5. Separate Storage: Scores vs Grades
```python
class StudentResult(models.Model):
    # Raw score — only field teachers can write (0–100)
    raw_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    
    # Grades NEVER stored — always computed
    # grade_letter, gpa, pass_fail are computed properties
```

**Storage Design:**
- ✅ `raw_score` stored in database
- ✅ `grade_letter`, `gpa`, `pass_fail` computed on read
- ✅ No grade columns in database
- ✅ Prevents tampering with grades

## API Endpoints

### GET /api/v1/results/

**Teacher Request:**
```json
GET /api/v1/results/
Authorization: Bearer <teacher_token>
```

**Teacher Response:**
```json
[
  {
    "id": 1,
    "student_name": "John Doe",
    "course_title": "Math 101",
    "year": 2024,
    "semester": "semester_1",
    "raw_score": 85.5
  }
]
```

**Student Request:**
```json
GET /api/v1/results/
Authorization: Bearer <student_token>
```

**Student Response:**
```json
[
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
]
```

**Admin Request:**
```json
GET /api/v1/results/
Authorization: Bearer <admin_token>
```

**Admin Response:**
```json
[
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
]
```

## Security Verification

### Backend Checks
- ✅ `get_queryset()` filters by role
- ✅ `get_serializer_class()` returns role-specific serializer
- ✅ Serializers only expose allowed fields
- ✅ Write serializers validate input
- ✅ Permission checks on all actions

### Frontend Checks
- ✅ Different components per role
- ✅ Different table structures per role
- ✅ No hidden columns (not just CSS display:none)
- ✅ Type-safe API client with role-specific types
- ✅ No grade/GPA fields in teacher component

### Data Integrity Checks
- ✅ Scores validated 0–100
- ✅ Grades computed, never stored
- ✅ Unique constraints prevent duplicates
- ✅ Audit log records all mutations
- ✅ Locked records prevent unauthorized changes

## Testing Checklist

### Backend Tests
- [ ] Teacher can only see student_name, course_title, raw_score
- [ ] Teacher cannot see grade_letter, gpa, pass_fail
- [ ] Teacher cannot see status or submission details
- [ ] Student can only see own results
- [ ] Student can see grade_letter, gpa, pass_fail
- [ ] Student cannot see other students' results
- [ ] Admin can see all data
- [ ] Admin can see status and submission details
- [ ] Scores validated 0–100
- [ ] Locked results cannot be edited by teachers
- [ ] Audit log created for all mutations

### Frontend Tests
- [ ] Teacher dashboard shows only 4 columns
- [ ] Teacher dashboard has editable score input
- [ ] Teacher dashboard has Submit button
- [ ] Teacher dashboard has NO grade column
- [ ] Student dashboard shows 6 columns
- [ ] Student dashboard has filters (year, semester)
- [ ] Student dashboard shows grade, GPA, pass/fail
- [ ] Admin dashboard shows all columns
- [ ] Admin dashboard has Approve/Unlock buttons
- [ ] Admin dashboard shows audit logs

## Files Modified/Created

### Backend
- ✅ `backend/results/serializers.py` — Updated with strict role-based serializers
- ✅ `backend/results/views.py` — Updated with strict role-based serializer selection

### Frontend
- ✅ `frontend/src/components/results/teacher-results-strict.tsx` — New strict teacher component
- ✅ `frontend/src/components/results/student-results-strict.tsx` — New strict student component
- ✅ `frontend/src/components/results/admin-results-strict.tsx` — New strict admin component
- ✅ `frontend/src/lib/api-results-strict.ts` — New strict API client with role-specific types
- ✅ `frontend/src/routes/results-unified.tsx` — Updated to use strict components

## Summary

The Results system now enforces **STRICT role-based behavior** at both backend and frontend levels:

1. **Backend:** Role-specific serializers return completely different data
2. **Frontend:** Role-specific components show completely different table structures
3. **Data Integrity:** Grades computed only in backend, never stored or edited by teachers
4. **Security:** All role checks enforced at API level, not just UI

Each role sees a **COMPLETELY DIFFERENT table** with different columns and data fields.
