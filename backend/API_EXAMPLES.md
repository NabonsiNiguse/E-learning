# E-Learning API — Example Requests & Responses

Base URL: `http://localhost:8000/api/v1`

All responses follow this envelope:
```json
{ "success": true/false, "message": "...", "data": {...} }
```
Paginated lists add: `count`, `next`, `previous`, `results`.

---

## Authentication

### Register
```
POST /auth/register/
{
  "email": "student@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "password": "SecurePass@1",
  "password2": "SecurePass@1",
  "role": "student"
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Registration successful.",
  "user": { "id": 10, "email": "student@example.com", "role": "student", ... }
}
```

### Login
```
POST /auth/login/
{ "email": "dan.smith@example.com", "password": "Student@1234" }
```
Response `200`:
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": { "id": 4, "role": "student", "full_name": "Dan Smith", ... }
}
```

### Refresh Token
```
POST /auth/token/refresh/
{ "refresh": "<refresh_token>" }
```

### Logout
```
POST /auth/logout/
Authorization: Bearer <access_token>
{ "refresh": "<refresh_token>" }
```

### Get / Update My Profile
```
GET  /auth/me/
PATCH /auth/me/
Authorization: Bearer <access_token>
{ "first_name": "Daniel", "student_profile": { "bio": "Lifelong learner." } }
```

### Change Password
```
POST /auth/change-password/
Authorization: Bearer <access_token>
{ "old_password": "Student@1234", "new_password": "NewPass@5678" }
```

---

## Users (Admin only)

### List Users
```
GET /users/?role=student&search=dan&page=1
Authorization: Bearer <admin_token>
```

### Create User (any role)
```
POST /users/
Authorization: Bearer <admin_token>
{ "email": "newteacher@example.com", "first_name": "Tom", "last_name": "Hill",
  "password": "Pass@1234", "role": "teacher" }
```

### Deactivate User
```
DELETE /users/5/
Authorization: Bearer <admin_token>
```
Response: `{ "success": true, "message": "User deactivated." }`

---

## Courses

### List Courses
```
GET /courses/?status=published&category=Programming&search=python
Authorization: Bearer <any_token>
```

### Create Course (Teacher)
```
POST /courses/
Authorization: Bearer <teacher_token>
{
  "title": "React for Beginners",
  "description": "Learn React from scratch.",
  "category": "Programming",
  "is_premium": false,
  "price": 0,
  "status": "published",
  "tags": "react,javascript,frontend"
}
```
Response `201`:
```json
{
  "success": true,
  "message": "Course created.",
  "course": { "id": 5, "slug": "react-for-beginners", "teacher": 2, ... }
}
```

### Get Course Detail
```
GET /courses/1/
Authorization: Bearer <any_token>
```

### Update Course (Teacher owner or Admin)
```
PATCH /courses/1/
Authorization: Bearer <teacher_token>
{ "status": "published" }
```

### Delete Course
```
DELETE /courses/1/
Authorization: Bearer <teacher_token>
```

---

## Lessons

### List Lessons in a Course
```
GET /courses/1/lessons/
Authorization: Bearer <any_token>
```

### Create Lesson (Teacher owner)
```
POST /courses/1/lessons/
Authorization: Bearer <teacher_token>
{
  "title": "Setting Up React",
  "description": "Install Node and create-react-app.",
  "video_url": "https://example.com/videos/react-setup",
  "order": 1,
  "status": "published",
  "duration_min": 20
}
```

### Update Lesson Order
```
PATCH /courses/1/lessons/3/
Authorization: Bearer <teacher_token>
{ "order": 2 }
```

---

## Enrollments

### Enroll in a Free Course (Student)
```
POST /enrollments/
Authorization: Bearer <student_token>
{ "course": 1 }
```
Response `201`:
```json
{
  "success": true,
  "message": "Enrolled successfully.",
  "enrollment": { "id": 7, "status": "active", "course": 1, ... }
}
```

### Enroll in a Premium Course (Student — creates locked enrollment)
```
POST /enrollments/
Authorization: Bearer <student_token>
{ "course": 2 }
```
Response `201`:
```json
{
  "success": true,
  "message": "Enrolled. Payment required to unlock course.",
  "enrollment": { "id": 8, "status": "locked", ... }
}
```

### List My Enrollments
```
GET /enrollments/?status=active
Authorization: Bearer <student_token>
```

### Mark Course Completed
```
POST /enrollments/7/complete/
Authorization: Bearer <student_token>
```

---

## Progress

### Mark Lesson Complete
```
POST /progress/complete/
Authorization: Bearer <student_token>
{ "lesson_id": 3 }
```
Response `200`:
```json
{
  "success": true,
  "message": "Lesson marked as complete.",
  "progress": { "id": 12, "lesson": 3, "completed": true, "completed_at": "..." },
  "course_completion_percentage": 40.0
}
```

### Get Course Progress Summary
```
GET /progress/course/1/
Authorization: Bearer <student_token>
```
Response:
```json
{
  "success": true,
  "course_id": 1,
  "total_lessons": 5,
  "completed_lessons": 2,
  "completion_percentage": 40.0,
  "lessons": [
    { "lesson_id": 1, "title": "Intro", "order": 1, "completed": true, "completed_at": "..." },
    { "lesson_id": 2, "title": "Variables", "order": 2, "completed": true, "completed_at": "..." },
    { "lesson_id": 3, "title": "Control Flow", "order": 3, "completed": false, "completed_at": null }
  ]
}
```

---

## Payments

### Initiate Mock Payment (Student)
```
POST /payments/initiate/
Authorization: Bearer <student_token>
{
  "course_id": 2,
  "payment_method": "mock_card",
  "simulate": "success"
}
```
Response `200`:
```json
{
  "success": true,
  "message": "Payment successful. Course unlocked.",
  "payment": { "id": 3, "reference": "PAY-A1B2C3D4E5F6", "status": "success", "amount": "49.99" },
  "enrollment": { "id": 8, "status": "active", ... }
}
```

### Simulate Failed Payment
```
POST /payments/initiate/
Authorization: Bearer <student_token>
{ "course_id": 4, "payment_method": "mock_card", "simulate": "fail" }
```
Response `402`:
```json
{
  "success": false,
  "message": "Payment failed.",
  "payment": { "status": "failed", "failure_reason": "Simulated payment failure." }
}
```

### List My Payments
```
GET /payments/
Authorization: Bearer <student_token>
```

---

## Notifications

### List Notifications
```
GET /notifications/
Authorization: Bearer <any_token>
```

### Mark One as Read
```
PATCH /notifications/3/read/
Authorization: Bearer <any_token>
```

### Mark All as Read
```
POST /notifications/read-all/
Authorization: Bearer <any_token>
```

---

## Dashboards

### Admin Dashboard
```
GET /dashboard/admin/
Authorization: Bearer <admin_token>
```
Response:
```json
{
  "success": true,
  "data": {
    "totals": {
      "users": 9, "teachers": 3, "students": 5,
      "courses": 4, "published_courses": 4,
      "enrollments": 6, "active_enrollments": 5,
      "successful_payments": 3
    },
    "last_30_days": { "new_users": 9, "new_enrollments": 6, "new_payments": 3 },
    "top_courses": [{ "id": 1, "title": "Complete Python Bootcamp", "enroll_count": 2 }]
  }
}
```

### Teacher Dashboard
```
GET /dashboard/teacher/
Authorization: Bearer <teacher_token>
```

### Student Dashboard
```
GET /dashboard/student/
Authorization: Bearer <student_token>
```
Response:
```json
{
  "success": true,
  "data": {
    "total_enrolled": 2,
    "active_courses": 2,
    "locked_courses": 0,
    "completed_courses": 0,
    "enrollments": [
      {
        "course_title": "Complete Python Bootcamp",
        "completion_percentage": 40.0,
        "next_lesson": { "id": 3, "title": "Control Flow", "order": 3 }
      }
    ]
  }
}
```

---

## Error Response Format

All errors follow:
```json
{
  "success": false,
  "message": "Human-readable summary.",
  "errors": { "field_name": ["Validation detail."] }
}
```

Common HTTP status codes used:
- `400` — Validation error
- `401` — Not authenticated
- `403` — Permission denied
- `404` — Not found
- `402` — Payment required
- `409` — Conflict (duplicate enrollment, etc.)
