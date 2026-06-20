# Results API Documentation

Unified API for grade management, corrections, and appeals.

## Endpoints

### 1. Student Views Own Grades
**GET** `/api/v1/results/my-grades/`

Returns all grade corrections for the authenticated student.

**Response:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "submission_id": "sub_123",
      "assignment_id": "asgn_1",
      "student": 5,
      "student_detail": {
        "id": 5,
        "email": "student@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "corrected_by": 2,
      "corrected_by_detail": {
        "id": 2,
        "email": "teacher@example.com",
        "first_name": "Jane",
        "last_name": "Smith"
      },
      "corrected_by_role": "teacher",
      "old_score": 75.00,
      "new_score": 85.00,
      "reason": "Recalculation - missed partial credit",
      "created_at": "2026-05-04T10:30:00Z"
    }
  ]
}
```

---

### 2. Submit Grade Appeal
**POST** `/api/v1/results/appeals/`

Student submits an appeal for a graded submission.

**Request:**
```json
{
  "submission_id": "sub_123",
  "assignment_id": "asgn_1",
  "reason": "I believe my answer was correct. The rubric says..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "submission_id": "sub_123",
    "assignment_id": "asgn_1",
    "student": 5,
    "student_detail": {...},
    "reason": "I believe my answer was correct...",
    "status": "pending",
    "teacher_response": "",
    "teacher_reviewed_by": null,
    "teacher_reviewed_detail": null,
    "teacher_reviewed_at": null,
    "override_score": null,
    "override_reason": "",
    "override_by": null,
    "override_by_detail": null,
    "override_at": null,
    "created_at": "2026-05-04T10:30:00Z",
    "updated_at": "2026-05-04T10:30:00Z"
  }
}
```

---

### 3. List Appeals (Role-Based)
**GET** `/api/v1/results/appeals/`

- **Students**: See only their own appeals
- **Teachers**: See appeals for their course assignments (PENDING, REVIEWED, ESCALATED)
- **Admins/SuperAdmins**: See all appeals

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "submission_id": "sub_123",
      "assignment_id": "asgn_1",
      "student": 5,
      "student_detail": {...},
      "reason": "I believe my answer was correct...",
      "status": "pending",
      "teacher_response": "",
      "teacher_reviewed_by": null,
      "teacher_reviewed_detail": null,
      "teacher_reviewed_at": null,
      "override_score": null,
      "override_reason": "",
      "override_by": null,
      "override_by_detail": null,
      "override_at": null,
      "created_at": "2026-05-04T10:30:00Z",
      "updated_at": "2026-05-04T10:30:00Z"
    }
  ]
}
```

---

### 4. Teacher Reviews Appeal
**PATCH** `/api/v1/results/appeals/<id>/review/`

Teacher reviews a pending appeal and either marks it as reviewed or escalates it.

**Request:**
```json
{
  "action": "escalated",
  "teacher_response": "I've reviewed your work. The grading was correct per the rubric. However, I'm escalating this to the Academic Manager for final review."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "submission_id": "sub_123",
    "assignment_id": "asgn_1",
    "student": 5,
    "student_detail": {...},
    "reason": "I believe my answer was correct...",
    "status": "escalated",
    "teacher_response": "I've reviewed your work...",
    "teacher_reviewed_by": 2,
    "teacher_reviewed_detail": {...},
    "teacher_reviewed_at": "2026-05-04T11:00:00Z",
    "override_score": null,
    "override_reason": "",
    "override_by": null,
    "override_by_detail": null,
    "override_at": null,
    "created_at": "2026-05-04T10:30:00Z",
    "updated_at": "2026-05-04T11:00:00Z"
  }
}
```

**Valid actions:**
- `"reviewed"` - Mark as reviewed (status → REVIEWED)
- `"escalated"` - Escalate to Academic Manager (status → ESCALATED)

---

### 5. SuperAdmin Overrides Appeal
**PATCH** `/api/v1/results/appeals/<id>/override/`

Academic Manager approves or rejects an escalated appeal.

**Request (Approve):**
```json
{
  "action": "approved",
  "override_score": 90.00,
  "override_reason": "Upon review, the student's interpretation of the question was valid. The rubric should have allowed for this interpretation. Grade updated to reflect correct understanding."
}
```

**Request (Reject):**
```json
{
  "action": "rejected",
  "override_reason": "The original grading was correct. The rubric clearly states that only the standard interpretation is acceptable. No grade change warranted."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "submission_id": "sub_123",
    "assignment_id": "asgn_1",
    "student": 5,
    "student_detail": {...},
    "reason": "I believe my answer was correct...",
    "status": "approved",
    "teacher_response": "I've reviewed your work...",
    "teacher_reviewed_by": 2,
    "teacher_reviewed_detail": {...},
    "teacher_reviewed_at": "2026-05-04T11:00:00Z",
    "override_score": 90.00,
    "override_reason": "Upon review, the student's interpretation...",
    "override_by": 1,
    "override_by_detail": {
      "id": 1,
      "email": "admin@example.com",
      "first_name": "Admin",
      "last_name": "User"
    },
    "override_at": "2026-05-04T12:00:00Z",
    "created_at": "2026-05-04T10:30:00Z",
    "updated_at": "2026-05-04T12:00:00Z"
  }
}
```

**Validation:**
- `override_reason` must be ≥ 20 characters
- `override_score` required when approving
- `override_score` must be non-negative
- Appeal must be in ESCALATED status

**Side Effect:** When approved, automatically creates a GradeCorrection audit record.

---

### 6. List Grade Corrections (Admin/Teacher)
**GET** `/api/v1/results/corrections/`

- **Teachers**: See only corrections they made
- **Admins/SuperAdmins**: See all corrections
- **Students**: No access

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "submission_id": "sub_123",
      "assignment_id": "asgn_1",
      "student": 5,
      "student_detail": {...},
      "corrected_by": 2,
      "corrected_by_detail": {...},
      "corrected_by_role": "teacher",
      "old_score": 75.00,
      "new_score": 85.00,
      "reason": "Recalculation - missed partial credit",
      "created_at": "2026-05-04T10:30:00Z"
    }
  ]
}
```

---

### 7. Create Grade Correction (Teacher/SuperAdmin)
**POST** `/api/v1/results/corrections/`

Teacher or SuperAdmin creates a grade correction.

**Request:**
```json
{
  "submission_id": "sub_123",
  "assignment_id": "asgn_1",
  "student": 5,
  "old_score": 75.00,
  "new_score": 85.00,
  "reason": "Recalculation - missed partial credit on question 3"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "submission_id": "sub_123",
    "assignment_id": "asgn_1",
    "student": 5,
    "student_detail": {...},
    "corrected_by": 2,
    "corrected_by_detail": {...},
    "corrected_by_role": "teacher",
    "old_score": 75.00,
    "new_score": 85.00,
    "reason": "Recalculation - missed partial credit on question 3",
    "created_at": "2026-05-04T10:30:00Z"
  }
}
```

**Validation:**
- Teachers can only correct grades for their own course assignments
- SuperAdmins can correct any grade
- `reason` is required and must be non-empty

---

## Appeal Workflow

```
PENDING (student submits)
   ↓
   ├─→ REVIEWED (teacher reviews, no escalation)
   │
   └─→ ESCALATED (teacher escalates)
       ↓
       ├─→ APPROVED (SuperAdmin approves + creates GradeCorrection)
       │
       └─→ REJECTED (SuperAdmin rejects)
```

## Permission Matrix

| Action | Student | Teacher | Admin | SuperAdmin |
|--------|---------|---------|-------|-----------|
| View own grades | ✅ | ❌ | ❌ | ❌ |
| Submit appeal | ✅ | ❌ | ❌ | ❌ |
| View own appeals | ✅ | ❌ | ❌ | ❌ |
| View course appeals | ❌ | ✅ | ❌ | ❌ |
| Review appeal | ❌ | ✅ | ❌ | ❌ |
| View all appeals | ❌ | ❌ | ✅ | ✅ |
| Override appeal | ❌ | ❌ | ❌ | ✅ |
| Create correction | ❌ | ✅ | ❌ | ✅ |
| View corrections | ❌ | ✅ | ✅ | ✅ |

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "A reason is required for the appeal."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You can only review appeals for your own courses."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Appeal not found."
}
```
