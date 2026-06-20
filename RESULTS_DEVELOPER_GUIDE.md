# Results System — Developer Quick Start

## Overview

The Results system enforces **strict role-based behavior** at both backend and frontend levels.

- **Teachers**: Enter scores only (0-100), no grades
- **Students**: View own results with grades (read-only)
- **Admins**: Full control, manage grading rules

---

## Backend Architecture

### Key Files

```
backend/results/
├── models.py           # StudentResult, GradingScale, GradingRule, ResultAuditLog
├── serializers.py      # TeacherResultSerializer, StudentResultSerializer, AdminResultSerializer
├── views.py            # ResultsViewSet with role-based get_serializer_class()
├── urls.py             # /api/v1/results/ endpoint
└── test_role_based_endpoints.py  # 10+ test cases
```

### How It Works

1. **Request arrives at `/api/v1/results/`**
2. **ViewSet checks user role**
3. **get_queryset()** filters data by role
4. **get_serializer_class()** returns role-specific serializer
5. **Serializer exposes only allowed fields**
6. **Response sent with role-specific data**

### Example: Teacher Request

```python
# Teacher makes request
GET /api/v1/results/

# Backend:
# 1. get_queryset() → StudentResult.objects.filter(course__teacher=user)
# 2. get_serializer_class() → TeacherResultSerializer
# 3. TeacherResultSerializer fields: id, student_name, course_title, year, semester, raw_score
# 4. Response: NO grade_letter, NO gpa, NO pass_fail

# Response:
{
  "id": 1,
  "student_name": "John Doe",
  "course_title": "Math 101",
  "year": 2024,
  "semester": "semester_1",
  "raw_score": 87.5
}
```

### Serializer Comparison

| Field | Teacher | Student | Admin |
|-------|---------|---------|-------|
| id | ✅ | ✅ | ✅ |
| student_name | ✅ | ❌ | ❌ |
| student_detail | ❌ | ❌ | ✅ |
| course_title | ✅ | ✅ | ✅ |
| course_teacher | ❌ | ✅ | ✅ |
| year | ✅ | ✅ | ✅ |
| semester | ✅ | ✅ | ✅ |
| raw_score | ✅ | ✅ | ✅ |
| grade_letter | ❌ | ✅ | ✅ |
| gpa | ❌ | ✅ | ✅ |
| pass_fail | ❌ | ✅ | ✅ |
| status | ❌ | ❌ | ✅ |
| submitted_at | ❌ | ❌ | ✅ |
| approved_at | ❌ | ❌ | ✅ |
| unlocked_at | ❌ | ❌ | ✅ |

---

## Frontend Architecture

### Key Files

```
frontend/src/
├── components/results/
│   ├── teacher-results-strict.tsx    # 4 columns: Student, Course, Score, Actions
│   ├── student-results-strict.tsx    # 6 columns: Course, Score, Grade, GPA, Status, Period
│   └── admin-results-strict.tsx      # 7+ columns: Full control
├── lib/
│   └── api-results-strict.ts         # Type-safe API client with role-specific types
└── routes/
    └── results-unified.tsx           # Unified route with role-based routing
```

### How It Works

1. **User navigates to `/results-unified`**
2. **Route checks user role**
3. **Renders appropriate component**
4. **Component calls API with role-specific types**
5. **Backend returns role-specific data**
6. **Component displays role-specific table**

### Example: Teacher Component

```typescript
// TeacherResultsStrict component
// Table columns: Student | Course | Score (editable) | Actions
// NO grade column, NO GPA column, NO final score column

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Student</TableHead>
      <TableHead>Course</TableHead>
      <TableHead>Score (0–100)</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {results.map(result => (
      <TableRow key={result.id}>
        <TableCell>{result.student_name}</TableCell>
        <TableCell>{result.course_title}</TableCell>
        <TableCell>
          {/* Editable input */}
          <Input value={result.raw_score} onChange={...} />
        </TableCell>
        <TableCell>
          <Button onClick={() => submitResult(result.id)}>Submit</Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Example: Student Component

```typescript
// StudentResultsStrict component
// Table columns: Course | Teacher | Score | Grade | GPA | Pass/Fail | Period
// Read-only, with filters

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Course</TableHead>
      <TableHead>Teacher</TableHead>
      <TableHead>Score</TableHead>
      <TableHead>Grade</TableHead>
      <TableHead>GPA</TableHead>
      <TableHead>Pass/Fail</TableHead>
      <TableHead>Period</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {results.map(result => (
      <TableRow key={result.id}>
        <TableCell>{result.course_title}</TableCell>
        <TableCell>{result.course_teacher}</TableCell>
        <TableCell>{result.raw_score}</TableCell>
        <TableCell>{result.grade_letter}</TableCell>
        <TableCell>{result.gpa}</TableCell>
        <TableCell>{result.pass_fail}</TableCell>
        <TableCell>{result.year} {result.semester}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Data Flow

### Teacher Workflow

```
1. Teacher logs in
   ↓
2. Navigates to /results-unified
   ↓
3. Route renders TeacherResultsStrict component
   ↓
4. Component calls getResults()
   ↓
5. Backend:
   - get_queryset() filters by course__teacher=user
   - get_serializer_class() returns TeacherResultSerializer
   - Returns: id, student_name, course_title, year, semester, raw_score
   ↓
6. Component displays table with 4 columns (no grades)
   ↓
7. Teacher edits raw_score
   ↓
8. Component calls updateResultScore(resultId, score)
   ↓
9. Backend:
   - TeacherScoreWriteSerializer validates score 0-100
   - Updates StudentResult.raw_score
   - Logs action in ResultAuditLog
   ↓
10. Teacher clicks Submit
    ↓
11. Component calls submitResult(resultId)
    ↓
12. Backend:
    - Sets status = 'submitted'
    - Sets submitted_at = now()
    - Sets submitted_by = user
    - Result is now locked
    ↓
13. Component shows "Submitted and locked"
```

### Student Workflow

```
1. Student logs in
   ↓
2. Navigates to /results-unified
   ↓
3. Route renders StudentResultsStrict component
   ↓
4. Component calls getResults()
   ↓
5. Backend:
   - get_queryset() filters by student=user
   - get_serializer_class() returns StudentResultSerializer
   - Computes grades via compute_grade()
   - Returns: id, course_title, course_teacher, year, semester, raw_score, grade_letter, gpa, pass_fail
   ↓
6. Component displays table with 6 columns (with grades)
   ↓
7. Student views results (read-only)
   ↓
8. Student can filter by year/semester
```

### Admin Workflow

```
1. Admin logs in
   ↓
2. Navigates to /results-unified
   ↓
3. Route renders AdminResultsStrict component
   ↓
4. Component calls getResults()
   ↓
5. Backend:
   - get_queryset() returns all StudentResult objects
   - get_serializer_class() returns AdminResultSerializer
   - Returns: ALL fields including status, submitted_at, approved_at, etc.
   ↓
6. Component displays table with 7+ columns (full control)
   ↓
7. Admin can:
   - View all students' results
   - Approve results
   - Unlock results for correction
   - View audit log
   - Manage grading scales
```

---

## Grade Computation

### How Grades Are Calculated

```python
# StudentResult.compute_grade() method

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

### Example

```
Raw Score: 87.5

Active GradingScale rules:
- A+: 95-100, GPA 4.0, pass
- A:  90-94.99, GPA 4.0, pass
- B+: 85-89.99, GPA 3.3, pass
- B:  80-84.99, GPA 3.0, pass
- C+: 75-79.99, GPA 2.7, pass
- C:  70-74.99, GPA 2.3, pass
- D:  60-69.99, GPA 1.0, pass
- F:  0-59.99, GPA 0.0, fail

compute_grade() finds rule where 85 <= 87.5 <= 89.99
Returns: {letter: 'B+', gpa: 3.3, pass_fail: 'pass'}
```

---

## Testing

### Run Tests

```bash
cd backend
python manage.py test results.test_role_based_endpoints -v 2
```

### Test Cases

1. ✅ Teacher gets only scores (no grades)
2. ✅ Student gets own results with grades
3. ✅ Admin gets all data
4. ✅ Teacher cannot see other teachers' students
5. ✅ Student cannot see other students' results
6. ✅ Grade fields excluded from teacher responses
7. ✅ Grade fields included in student/admin responses
8. ✅ Teacher cannot see grades in detail view
9. ✅ Student sees grades in detail view
10. ✅ Admin sees all fields in detail view

---

## Common Tasks

### Add a New Field to Teacher View

1. Add field to StudentResult model (if needed)
2. Add field to TeacherResultSerializer.Meta.fields
3. Add field to TeacherResult interface in api-results-strict.ts
4. Update TeacherResultsStrict component table

### Add a New Field to Student View

1. Add field to StudentResult model (if needed)
2. Add field to StudentResultSerializer.Meta.fields
3. Add field to StudentResult interface in api-results-strict.ts
4. Update StudentResultsStrict component table

### Add a New Field to Admin View

1. Add field to StudentResult model (if needed)
2. Add field to AdminResultSerializer.Meta.fields
3. Add field to AdminResult interface in api-results-strict.ts
4. Update AdminResultsStrict component table

### Change Grading Scale

1. Admin creates new GradingScale with rules
2. Sets is_active=True
3. All compute_grade() calls use new scale
4. Grades automatically recalculated on next read

### Unlock Result for Correction

1. Admin calls unlockResult(resultId)
2. Backend sets status='unlocked'
3. Teacher can edit raw_score again
4. Teacher resubmits
5. Admin approves again

---

## Security Notes

### ✅ Teachers Cannot See Grades
- Backend enforces via TeacherResultSerializer
- grade_letter, gpa, pass_fail NOT in serializer fields
- Not just UI hiding — backend-level enforcement

### ✅ Students Cannot Edit Results
- StudentResultSerializer all fields read_only=True
- Backend rejects any write attempts

### ✅ Scores Locked After Submission
- TeacherScoreWriteSerializer checks is_locked property
- Raises ValidationError if locked
- Only admin can unlock

### ✅ Grades Never Stored
- compute_grade() method calculates on read
- Grades not stored in database
- Always computed from active GradingScale

### ✅ All Mutations Logged
- ResultAuditLog records every change
- Immutable audit trail
- Admin can view via audit_log endpoint

---

## Troubleshooting

### Teacher Sees Grades

**Problem**: Teacher component shows grade column

**Solution**:
1. Check TeacherResultSerializer.Meta.fields
2. Ensure grade_letter, gpa, pass_fail NOT in fields
3. Check TeacherResultsStrict component
4. Ensure grade columns not rendered

### Student Sees Other Students' Results

**Problem**: Student component shows other students' results

**Solution**:
1. Check get_queryset() in ResultsViewSet
2. Ensure filter by student=request.user
3. Check StudentResultsStrict component
4. Verify API call uses correct endpoint

### Grades Not Computed

**Problem**: grade_letter, gpa, pass_fail are null

**Solution**:
1. Check if GradingScale exists and is_active=True
2. Check if raw_score is not null
3. Check if GradingRule exists for score range
4. Verify compute_grade() method logic

### Cannot Edit Score After Submission

**Problem**: Teacher cannot edit score after submitting

**Solution**:
1. This is expected behavior (scores are locked)
2. Admin must call unlockResult(resultId)
3. Then teacher can edit again
4. Teacher must resubmit

---

## API Endpoints

### Results

```
GET    /api/v1/results/                    # List results (role-based)
GET    /api/v1/results/{id}/               # Get result detail (role-based)
PATCH  /api/v1/results/{id}/               # Update result (role-based)
POST   /api/v1/results/{id}/submit/        # Teacher submits (locks)
POST   /api/v1/results/{id}/approve/       # Admin approves
POST   /api/v1/results/{id}/unlock/        # Admin unlocks
GET    /api/v1/results/audit_log/          # View audit trail (admin)
```

### Grading Scales

```
GET    /api/v1/results/grading-scales/     # List scales (admin)
POST   /api/v1/results/grading-scales/     # Create scale (admin)
PATCH  /api/v1/results/grading-scales/{id}/ # Update scale (admin)
DELETE /api/v1/results/grading-scales/{id}/ # Delete scale (admin)
```

### Grade Appeals

```
GET    /api/v1/results/appeals/            # List appeals (role-based)
POST   /api/v1/results/appeals/            # Create appeal (student)
POST   /api/v1/results/appeals/{id}/review/ # Review appeal (teacher)
POST   /api/v1/results/appeals/{id}/override/ # Override grade (admin)
```

---

## References

- `RESULTS_ENDPOINT_ROLE_BASED_BEHAVIOR.md` — Detailed endpoint behavior
- `RESULTS_STRICT_ROLE_ENFORCEMENT.md` — Security verification
- `IMPLEMENTATION_VERIFICATION.md` — Complete verification checklist
- `backend/results/test_role_based_endpoints.py` — Test cases
- `backend/results/models.py` — Model definitions
- `backend/results/serializers.py` — Serializer definitions
- `backend/results/views.py` — View definitions

