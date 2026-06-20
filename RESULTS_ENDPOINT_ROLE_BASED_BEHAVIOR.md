# Results Endpoint — Role-Based Behavior

## Overview

The `/api/v1/results/` endpoint returns **completely different data** based on the user's role. This ensures:
- Teachers NEVER see grades
- Students ONLY see their own results
- Admins see everything

## Endpoint: GET /api/v1/results/

### Teacher Request
```bash
GET /api/v1/results/
Authorization: Bearer <teacher_token>
```

### Teacher Response
**Fields Returned:**
```json
{
  "id": 1,
  "student_name": "John Doe",
  "course_title": "Math 101",
  "year": 2024,
  "semester": "semester_1",
  "raw_score": 87.5
}
```

**What Teachers See:**
- ✅ `id` — Result ID
- ✅ `student_name` — Student's full name
- ✅ `course_title` — Course name
- ✅ `year` — Academic year
- ✅ `semester` — Semester (semester_1, semester_2, summer)
- ✅ `raw_score` — Raw score (0-100)

**What Teachers CANNOT See:**
- ❌ `grade_letter` — NOT included
- ❌ `gpa` — NOT included
- ❌ `pass_fail` — NOT included
- ❌ `status` — NOT included
- ❌ `submitted_at` — NOT included
- ❌ `approved_at` — NOT included
- ❌ `student_detail` — NOT included

**Serializer Used:** `TeacherResultSerializer`

---

### Student Request
```bash
GET /api/v1/results/
Authorization: Bearer <student_token>
```

### Student Response
**Fields Returned:**
```json
{
  "id": 1,
  "course_title": "Math 101",
  "course_teacher": "Jane Smith",
  "year": 2024,
  "semester": "semester_1",
  "raw_score": 87.5,
  "grade_letter": "B+",
  "gpa": 3.3,
  "pass_fail": "pass"
}
```

**What Students See:**
- ✅ `id` — Result ID
- ✅ `course_title` — Course name
- ✅ `course_teacher` — Teacher's name
- ✅ `year` — Academic year
- ✅ `semester` — Semester
- ✅ `raw_score` — Final score (0-100)
- ✅ `grade_letter` — Grade (A+, A, B+, etc.) — **COMPUTED**
- ✅ `gpa` — GPA points (4.0, 3.3, 3.0, etc.) — **COMPUTED**
- ✅ `pass_fail` — Pass/fail status — **COMPUTED**

**What Students CANNOT See:**
- ❌ `status` — NOT included
- ❌ `submitted_at` — NOT included
- ❌ `approved_at` — NOT included
- ❌ `student_detail` — NOT included
- ❌ Other students' results

**Serializer Used:** `StudentResultSerializer`

**Note:** Students can ONLY see their own results. The endpoint filters by `student=request.user`.

---

### Admin Request
```bash
GET /api/v1/results/
Authorization: Bearer <admin_token>
```

### Admin Response
**Fields Returned:**
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
  "raw_score": 87.5,
  "grade_letter": "B+",
  "gpa": 3.3,
  "pass_fail": "pass",
  "status": "draft",
  "submitted_at": null,
  "submitted_by": null,
  "approved_at": null,
  "approved_by": null,
  "unlocked_at": null,
  "unlocked_by": null,
  "created_at": "2024-05-10T08:00:00Z",
  "updated_at": "2024-05-15T10:30:00Z"
}
```

**What Admins See:**
- ✅ `id` — Result ID
- ✅ `student` — Student ID
- ✅ `student_detail` — Full student information
- ✅ `course` — Course ID
- ✅ `course_title` — Course name
- ✅ `course_teacher` — Teacher's name
- ✅ `year` — Academic year
- ✅ `semester` — Semester
- ✅ `raw_score` — Raw score
- ✅ `grade_letter` — Grade — **COMPUTED**
- ✅ `gpa` — GPA — **COMPUTED**
- ✅ `pass_fail` — Pass/fail — **COMPUTED**
- ✅ `status` — Result status (draft, submitted, approved, unlocked)
- ✅ `submitted_at` — Submission timestamp
- ✅ `submitted_by` — Who submitted
- ✅ `approved_at` — Approval timestamp
- ✅ `approved_by` — Who approved
- ✅ `unlocked_at` — Unlock timestamp
- ✅ `unlocked_by` — Who unlocked
- ✅ `created_at` — Creation timestamp
- ✅ `updated_at` — Last update timestamp

**What Admins Can See:**
- ✅ ALL results across ALL students
- ✅ ALL courses
- ✅ Full submission workflow
- ✅ Audit information

**Serializer Used:** `AdminResultSerializer`

---

## Implementation Details

### Backend Serializer Selection

```python
def get_serializer_class(self):
    """
    STRICT role-based serializer selection.
    Each role gets a COMPLETELY DIFFERENT serializer with different fields.
    """
    user = self.request.user
    
    # READ operations
    if user.is_admin:
        return AdminResultSerializer
    elif user.is_teacher:
        return TeacherResultSerializer
    elif user.is_student:
        return StudentResultSerializer
    
    return StudentResultSerializer
```

### Backend Query Filtering

```python
def get_queryset(self):
    user = self.request.user
    if user.is_admin:
        return StudentResult.objects.all()
    elif user.is_teacher:
        # Teacher sees results for their courses only
        return StudentResult.objects.filter(course__teacher=user)
    elif user.is_student:
        # Student sees only their own results
        return StudentResult.objects.filter(student=user)
    return StudentResult.objects.none()
```

### Serializer Definitions

#### TeacherResultSerializer
```python
class TeacherResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = StudentResult
        fields = [
            'id',
            'student_name',
            'course_title',
            'year', 'semester',
            'raw_score',
        ]
        read_only_fields = ['id', 'student_name', 'course_title', 'year', 'semester']
```

#### StudentResultSerializer
```python
class StudentResultSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_teacher = serializers.CharField(source='course.teacher.full_name', read_only=True)
    
    grade_letter = serializers.SerializerMethodField()
    gpa = serializers.SerializerMethodField()
    pass_fail = serializers.SerializerMethodField()

    class Meta:
        model = StudentResult
        fields = [
            'id',
            'course_title',
            'course_teacher',
            'year', 'semester',
            'raw_score',
            'grade_letter',
            'gpa',
            'pass_fail',
        ]
        read_only_fields = fields

    def get_grade_letter(self, obj):
        computed = obj.compute_grade()
        return computed['letter'] if computed else None

    def get_gpa(self, obj):
        computed = obj.compute_grade()
        return computed['gpa'] if computed else None

    def get_pass_fail(self, obj):
        computed = obj.compute_grade()
        return computed['pass_fail'] if computed else None
```

#### AdminResultSerializer
```python
class AdminResultSerializer(serializers.ModelSerializer):
    student_detail = UserListSerializer(source='student', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_teacher = serializers.CharField(source='course.teacher.full_name', read_only=True)
    
    grade_letter = serializers.SerializerMethodField()
    gpa = serializers.SerializerMethodField()
    pass_fail = serializers.SerializerMethodField()

    class Meta:
        model = StudentResult
        fields = [
            'id',
            'student', 'student_detail',
            'course', 'course_title', 'course_teacher',
            'year', 'semester',
            'raw_score',
            'grade_letter', 'gpa', 'pass_fail',
            'status',
            'submitted_at', 'submitted_by',
            'approved_at', 'approved_by',
            'unlocked_at', 'unlocked_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_grade_letter(self, obj):
        computed = obj.compute_grade()
        return computed['letter'] if computed else None

    def get_gpa(self, obj):
        computed = obj.compute_grade()
        return computed['gpa'] if computed else None

    def get_pass_fail(self, obj):
        computed = obj.compute_grade()
        return computed['pass_fail'] if computed else None
```

---

## Key Points

### 1. Grades NEVER Sent to Teachers
- ✅ `grade_letter` field NOT in TeacherResultSerializer
- ✅ `gpa` field NOT in TeacherResultSerializer
- ✅ `pass_fail` field NOT in TeacherResultSerializer
- ✅ Backend enforces this at serializer level

### 2. Students ONLY See Own Results
- ✅ `get_queryset()` filters by `student=request.user`
- ✅ Students cannot access other students' results
- ✅ Backend enforces this at query level

### 3. Grades Computed, Never Stored
- ✅ `grade_letter`, `gpa`, `pass_fail` are computed properties
- ✅ Computed from active GradingScale
- ✅ Computed on read, not stored in database

### 4. Each Role Gets Different Data
- ✅ Teacher: 6 fields (no grades)
- ✅ Student: 9 fields (with grades)
- ✅ Admin: 20+ fields (all data)

### 5. Backend Enforces Role-Based Access
- ✅ Not just UI hiding
- ✅ Serializer level enforcement
- ✅ Query level filtering
- ✅ Permission checks

---

## Testing

### Test Teacher Endpoint
```bash
curl -H "Authorization: Bearer <teacher_token>" \
  http://localhost:8000/api/v1/results/
```

**Expected:** Only student_name, course_title, raw_score (NO grades)

### Test Student Endpoint
```bash
curl -H "Authorization: Bearer <student_token>" \
  http://localhost:8000/api/v1/results/
```

**Expected:** course_title, raw_score, grade_letter, gpa, pass_fail (WITH grades)

### Test Admin Endpoint
```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/v1/results/
```

**Expected:** All fields including status and submission details

---

## Summary

The `/api/v1/results/` endpoint enforces **strict role-based behavior**:

| Role | Fields | Grades | Status | Other Students |
|------|--------|--------|--------|-----------------|
| Teacher | 6 | ❌ NO | ❌ NO | ❌ NO |
| Student | 9 | ✅ YES | ❌ NO | ❌ NO |
| Admin | 20+ | ✅ YES | ✅ YES | ✅ YES |

**Backend enforces this at both serializer and query levels.**
