# Results System — Quick Setup Guide

## Backend Setup

### 1. Models Already Exist
The models are already defined in `backend/results/models.py`:
- GradingScale
- GradingRule
- StudentResult
- ResultAuditLog
- GradeAppeal

### 2. Run Migrations
```bash
cd backend
python manage.py makemigrations results
python manage.py migrate results
```

### 3. Create Initial Grading Scale (Admin)
Use Django admin or API:

```bash
python manage.py shell
```

```python
from results.models import GradingScale, GradingRule

# Create scale
scale = GradingScale.objects.create(
    name="Standard 2024",
    is_active=True,
    created_by_id=1  # Admin user ID
)

# Create rules
rules = [
    {"letter": "A+", "min_score": 95, "max_score": 100, "gpa_points": 4.0, "pass_fail": "pass"},
    {"letter": "A",  "min_score": 90, "max_score": 94.99, "gpa_points": 4.0, "pass_fail": "pass"},
    {"letter": "B+", "min_score": 85, "max_score": 89.99, "gpa_points": 3.3, "pass_fail": "pass"},
    {"letter": "B",  "min_score": 80, "max_score": 84.99, "gpa_points": 3.0, "pass_fail": "pass"},
    {"letter": "C+", "min_score": 75, "max_score": 79.99, "gpa_points": 2.3, "pass_fail": "pass"},
    {"letter": "C",  "min_score": 70, "max_score": 74.99, "gpa_points": 2.0, "pass_fail": "pass"},
    {"letter": "D",  "min_score": 60, "max_score": 69.99, "gpa_points": 1.0, "pass_fail": "pass"},
    {"letter": "F",  "min_score": 0,  "max_score": 59.99, "gpa_points": 0.0, "pass_fail": "fail"},
]

for rule in rules:
    GradingRule.objects.create(scale=scale, **rule)

print("Grading scale created!")
```

### 4. Create Test Data (Optional)
```python
from django.contrib.auth import get_user_model
from courses.models import Course
from results.models import StudentResult

User = get_user_model()

# Get teacher and student
teacher = User.objects.filter(role='teacher').first()
student = User.objects.filter(role='student').first()

# Get course
course = Course.objects.filter(teacher=teacher).first()

if teacher and student and course:
    # Create result
    result = StudentResult.objects.create(
        student=student,
        course=course,
        year=2024,
        semester='semester_1',
        raw_score=None,  # Teacher will enter this
        status='draft'
    )
    print(f"Created result: {result}")
```

## Frontend Setup

### 1. API Client Already Created
File: `frontend/src/lib/api-results.ts`
- All endpoints configured
- Type definitions included

### 2. Components Already Created
- `frontend/src/components/results/student-results.tsx`
- `frontend/src/components/results/teacher-results.tsx`
- `frontend/src/components/results/admin-results.tsx`

### 3. Unified Route Already Created
File: `frontend/src/routes/results-unified.tsx`
- Routes to appropriate component based on user role
- Accessible at `/results-unified`

### 4. Update Navigation (Optional)
Add to `frontend/src/components/layout/app-sidebar.tsx`:

```typescript
{
  label: "Results",
  href: "/results-unified",
  icon: BarChart3,
  badge: user?.role === "teacher" ? draftCount : undefined,
}
```

## Testing the System

### 1. Test as Teacher
1. Login as teacher
2. Navigate to `/results-unified`
3. Should see "Score Entry" dashboard
4. Enter scores for students (0–100)
5. Click "Submit" to lock
6. Verify scores are locked after submission

### 2. Test as Student
1. Login as student
2. Navigate to `/results-unified`
3. Should see "My Results" dashboard
4. View own results (read-only)
5. Filter by year/semester
6. Verify grades/GPA computed correctly

### 3. Test as Admin
1. Login as admin
2. Navigate to `/results-unified`
3. Should see "Results Management" dashboard
4. View all results
5. Approve submitted results
6. Unlock results if needed
7. View audit logs
8. Manage grading scales

## API Testing with cURL

### Get Results (Teacher)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/results/
```

### Update Score (Teacher)
```bash
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"raw_score": 85.5}' \
  http://localhost:8000/api/v1/results/1/
```

### Submit Result (Teacher)
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/results/1/submit/
```

### Approve Result (Admin)
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/results/1/approve/
```

### Get Audit Log (Admin)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/results/audit_log/?result_id=1
```

### Get Grading Scales (Admin)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/results/grading-scales/
```

## Troubleshooting

### Issue: 404 on `/results-unified`
**Solution**: Ensure route is registered in frontend router. Check `frontend/src/routes/results-unified.tsx` exists.

### Issue: API returns 403 Forbidden
**Solution**: Check user role and permissions. Ensure user is authenticated and has correct role.

### Issue: Grades not showing
**Solution**: Ensure active GradingScale exists. Run the setup script above.

### Issue: Cannot submit result
**Solution**: Ensure raw_score is set (not null). Status must be "draft".

## Database Schema

### StudentResult Table
```sql
CREATE TABLE student_results (
  id BIGINT PRIMARY KEY,
  student_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  year SMALLINT NOT NULL,
  semester VARCHAR(12) NOT NULL,
  raw_score DECIMAL(5,2),
  status VARCHAR(10) NOT NULL,
  submitted_at DATETIME,
  submitted_by_id BIGINT,
  approved_at DATETIME,
  approved_by_id BIGINT,
  unlocked_at DATETIME,
  unlocked_by_id BIGINT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE(student_id, course_id, year, semester),
  INDEX(year),
  INDEX(semester),
  INDEX(status)
);
```

### ResultAuditLog Table
```sql
CREATE TABLE result_audit_logs (
  id BIGINT PRIMARY KEY,
  result_id BIGINT NOT NULL,
  action VARCHAR(10) NOT NULL,
  performed_by_id BIGINT,
  performed_by_role VARCHAR(11) NOT NULL,
  old_value JSON,
  new_value JSON,
  note TEXT,
  timestamp DATETIME NOT NULL,
  INDEX(result_id),
  INDEX(timestamp)
);
```

## Performance Optimization

### Indexes
- `StudentResult.year` — for filtering by year
- `StudentResult.semester` — for filtering by semester
- `StudentResult.status` — for filtering by status
- `ResultAuditLog.result_id` — for audit log queries
- `ResultAuditLog.timestamp` — for time-based queries

### Query Optimization
- Use `select_related()` for foreign keys (student, course, teacher)
- Use `prefetch_related()` for reverse relations (audit logs)
- Pagination enabled by default (20 per page)

## Next Steps

1. **Create sample data** — use the test data script above
2. **Test all workflows** — follow the testing guide
3. **Configure email notifications** — notify students of approvals
4. **Set up audit log exports** — for compliance/auditing
5. **Add bulk import** — CSV upload for teachers
6. **Create reports** — grade distribution, pass rates, etc.

## Support

For issues or questions:
1. Check `RESULTS_SYSTEM.md` for detailed documentation
2. Review API endpoints in `backend/results/views.py`
3. Check frontend components for implementation details
4. Review audit logs for debugging mutations
