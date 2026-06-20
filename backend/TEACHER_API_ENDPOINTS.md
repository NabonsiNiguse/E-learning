# Teacher API Endpoints

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Base URL
```
http://localhost:8000/api/v1
```

---

## Course Management

### List Own Courses
**Endpoint**: `GET /teacher/courses/`

**Permission**: Teacher only

**Query Parameters**:
- `search` (optional): Search by title or description
- `status` (optional): Filter by status (draft, published, archived)
- `ordering` (optional): Order by field (-created_at, title, etc.)

**Response**:
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Advanced React Patterns",
      "slug": "advanced-react-patterns",
      "description": "Learn advanced React patterns...",
      "status": "published",
      "is_premium": true,
      "price": "49.99",
      "category": "Web Development",
      "tags": "react,javascript,frontend",
      "locked": false,
      "results_submitted_at": null,
      "teacher": 5,
      "created_at": "2024-04-15T10:30:00Z",
      "updated_at": "2024-05-01T14:20:00Z"
    }
  ]
}
```

---

### Create Course
**Endpoint**: `POST /teacher/courses/`

**Permission**: Teacher only

**Request Body**:
```json
{
  "title": "Advanced React Patterns",
  "slug": "advanced-react-patterns",
  "description": "Learn advanced React patterns and best practices",
  "category": "Web Development",
  "tags": "react,javascript,frontend",
  "is_premium": true,
  "price": "49.99"
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "title": "Advanced React Patterns",
  "slug": "advanced-react-patterns",
  "description": "Learn advanced React patterns and best practices",
  "status": "draft",
  "is_premium": true,
  "price": "49.99",
  "category": "Web Development",
  "tags": "react,javascript,frontend",
  "locked": false,
  "results_submitted_at": null,
  "teacher": 5,
  "created_at": "2024-05-02T10:30:00Z",
  "updated_at": "2024-05-02T10:30:00Z"
}
```

---

### Get Course Details
**Endpoint**: `GET /teacher/courses/{id}/`

**Permission**: Teacher only (must own the course)

**Response**: `200 OK`
```json
{
  "id": 1,
  "title": "Advanced React Patterns",
  "slug": "advanced-react-patterns",
  "description": "Learn advanced React patterns...",
  "status": "published",
  "is_premium": true,
  "price": "49.99",
  "category": "Web Development",
  "tags": "react,javascript,frontend",
  "locked": false,
  "results_submitted_at": null,
  "teacher": 5,
  "created_at": "2024-04-15T10:30:00Z",
  "updated_at": "2024-05-01T14:20:00Z"
}
```

---

### Update Course
**Endpoint**: `PATCH /teacher/courses/{id}/`

**Permission**: Teacher only (must own the course)

**Request Body** (all fields optional):
```json
{
  "title": "Advanced React Patterns - Updated",
  "description": "Updated description...",
  "status": "published",
  "price": "59.99",
  "category": "Web Development",
  "tags": "react,javascript,frontend,advanced"
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "title": "Advanced React Patterns - Updated",
  "description": "Updated description...",
  "status": "published",
  "price": "59.99",
  "category": "Web Development",
  "tags": "react,javascript,frontend,advanced",
  "locked": false,
  "results_submitted_at": null,
  "updated_at": "2024-05-02T15:45:00Z"
}
```

---

### Delete Course
**Endpoint**: `DELETE /teacher/courses/{id}/`

**Permission**: Teacher only (must own the course)

**Restrictions**:
- Cannot delete if course has active enrollments
- Must archive the course instead

**Response**: `204 No Content`

**Error Response** (if has active enrollments):
```json
{
  "detail": "Cannot delete course with 15 active enrollments. Archive the course instead."
}
```

---

### Get Course Statistics
**Endpoint**: `GET /teacher/courses/{id}/stats/`

**Permission**: Teacher only (must own the course)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "course_id": 1,
    "title": "Advanced React Patterns",
    "enrolled_students": 45,
    "total_lessons": 12,
    "status": "published",
    "locked": false,
    "results_submitted_at": null
  }
}
```

---

## Results Management

### Submit Final Results
**Endpoint**: `POST /teacher/courses/{id}/submit-results/`

**Permission**: Teacher only (must own the course)

**Request Body**: Empty or optional metadata
```json
{}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Results submitted and locked successfully.",
  "data": {
    "course_id": 1,
    "locked": true,
    "results_submitted_at": "2024-05-02T16:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Results already submitted or course not published
- `404 Not Found`: Course not found
- `403 Forbidden`: Not the course teacher

---

### Lock Results
**Endpoint**: `PATCH /teacher/courses/{id}/lock-results/`

**Permission**: Teacher only (must own the course)

**Request Body**: Empty
```json
{}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Results locked successfully.",
  "data": {
    "course_id": 1,
    "locked": true,
    "results_submitted_at": "2024-05-02T16:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Results already locked
- `404 Not Found`: Course not found
- `403 Forbidden`: Not the course teacher

---

## Grade Management

### Create Grade Correction
**Endpoint**: `POST /results/corrections/`

**Permission**: Teacher only (for own courses) or Super Admin

**Request Body**:
```json
{
  "submission_id": "sub_12345",
  "assignment_id": "5",
  "student": 10,
  "new_score": 92.5,
  "old_score": 85.0,
  "reason": "Rechecked submission, found calculation error in grading rubric."
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "submission_id": "sub_12345",
    "assignment_id": "5",
    "student": 10,
    "corrected_by": 5,
    "corrected_by_role": "teacher",
    "old_score": 85.0,
    "new_score": 92.5,
    "reason": "Rechecked submission, found calculation error in grading rubric.",
    "created_at": "2024-05-02T16:35:00Z"
  }
}
```

**Error Responses**:
- `403 Forbidden`: Not authorized to correct this grade
- `400 Bad Request`: Invalid data

---

### List Grade Corrections
**Endpoint**: `GET /results/corrections/`

**Permission**: Teacher (own corrections), Admin (all), Super Admin (all)

**Query Parameters**:
- `student` (optional): Filter by student ID
- `assignment_id` (optional): Filter by assignment ID
- `ordering` (optional): Order by field (-created_at, new_score, etc.)

**Response**: `200 OK`
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "submission_id": "sub_12345",
      "assignment_id": "5",
      "student": 10,
      "corrected_by": 5,
      "corrected_by_role": "teacher",
      "old_score": 85.0,
      "new_score": 92.5,
      "reason": "Rechecked submission, found calculation error in grading rubric.",
      "created_at": "2024-05-02T16:35:00Z"
    }
  ]
}
```

---

## Grade Appeals

### List Appeals for Teacher's Courses
**Endpoint**: `GET /results/appeals/`

**Permission**: Teacher (own courses), Admin (all), Super Admin (all), Student (own)

**Query Parameters**:
- `status` (optional): Filter by status (pending, reviewed, escalated, approved, rejected)
- `student` (optional): Filter by student ID
- `ordering` (optional): Order by field (-created_at, status, etc.)

**Response**: `200 OK`
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "submission_id": "sub_12345",
      "assignment_id": "5",
      "student": 10,
      "reason": "I believe my answer was correct based on the course materials.",
      "status": "pending",
      "teacher_response": null,
      "teacher_reviewed_by": null,
      "teacher_reviewed_at": null,
      "override_score": null,
      "override_reason": null,
      "override_by": null,
      "override_at": null,
      "created_at": "2024-05-01T10:00:00Z",
      "updated_at": "2024-05-01T10:00:00Z"
    }
  ]
}
```

---

### Review Grade Appeal
**Endpoint**: `PATCH /results/appeals/{id}/review/`

**Permission**: Teacher only (for own courses)

**Request Body**:
```json
{
  "teacher_response": "I reviewed your submission again. Your interpretation was incorrect based on the rubric provided in the syllabus.",
  "action": "reviewed"
}
```

**Parameters**:
- `action`: "reviewed" (mark as reviewed) or "escalated" (escalate to Super Admin)
- `teacher_response`: Required explanation (min 10 characters)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "submission_id": "sub_12345",
    "assignment_id": "5",
    "student": 10,
    "reason": "I believe my answer was correct based on the course materials.",
    "status": "reviewed",
    "teacher_response": "I reviewed your submission again. Your interpretation was incorrect based on the rubric provided in the syllabus.",
    "teacher_reviewed_by": 5,
    "teacher_reviewed_at": "2024-05-02T14:00:00Z",
    "override_score": null,
    "override_reason": null,
    "override_by": null,
    "override_at": null,
    "created_at": "2024-05-01T10:00:00Z",
    "updated_at": "2024-05-02T14:00:00Z"
  }
}
```

**Error Responses**:
- `403 Forbidden`: Not authorized to review this appeal
- `404 Not Found`: Appeal not found
- `400 Bad Request`: Invalid action or missing response

---

## Error Handling

### Common Error Responses

**401 Unauthorized** (Missing or invalid token):
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden** (Insufficient permissions):
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found**:
```json
{
  "detail": "Not found."
}
```

**400 Bad Request** (Invalid data):
```json
{
  "field_name": ["Error message"]
}
```

---

## Rate Limiting

- No rate limiting currently implemented
- Recommended: Implement rate limiting in production

---

## Pagination

List endpoints support pagination:
- Default page size: 20
- Query parameter: `?page=2`
- Response includes `count`, `next`, `previous`, `results`

---

## Filtering & Ordering

### Supported Filters
- `search`: Full-text search on title, description
- `status`: Exact match on status field
- `category`: Exact match on category field

### Supported Ordering
- `-created_at`: Newest first (default)
- `created_at`: Oldest first
- `title`: Alphabetical
- `-title`: Reverse alphabetical
- `status`: By status
- `-updated_at`: Most recently updated first

**Example**:
```
GET /teacher/courses/?search=react&status=published&ordering=-created_at
```

---

## Implementation Notes

1. **Scope Enforcement**: All queries automatically filter by `teacher=request.user`
2. **Immutable Corrections**: Grade corrections cannot be edited or deleted
3. **Audit Trail**: All changes are logged with timestamp and user info
4. **Validation**: Course ownership is verified on every request
5. **Soft Deletes**: Consider implementing soft deletes for courses instead of hard delete
