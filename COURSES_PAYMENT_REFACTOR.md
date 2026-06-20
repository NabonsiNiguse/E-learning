# Courses & Payment Pages — Senior Engineering Refactor

## Overview
Rewrote `courses.tsx` and `payment.$courseId.tsx` to eliminate mock data, implement proper role-based access control, and integrate fully with the real Django backend API.

## Key Changes

### 1. **courses.tsx** — From Mock to Real API

#### Before
- Used mock `Course` type with fields: `level`, `duration`, `rating`, `students`, `locked`, `instructor`, `thumbnailImg`
- Client-side filtering only — no server-side query params
- `locked` logic: `c.status !== "published"` (wrong)
- No real mutations for create/delete/publish
- Level filter existed but had no backend support

#### After
- Uses `ApiCourseListItem` from real API with fields: `id`, `title`, `slug`, `teacher_name`, `thumbnail`, `status`, `is_premium`, `price`, `category`, `lesson_count`, `enrolled_count`, `created_at`
- Server-side filtering: `search`, `category`, `status` passed as query params
- `isLocked` logic: `is_premium && !isEnrolled` (correct business rule)
- Real mutations wired:
  - `useCreateCourse()` — creates draft course
  - `useDeleteCourse()` — deletes course (admin only)
  - `usePublishCourse()` — toggles publish/unpublish/archive
- Students automatically see only `published` courses (enforced server-side)
- Gradient fallback derived from `category` (no `level` field exists)

#### Role-Based Access
- **Admin**: Full CRUD — view, publish/unpublish, delete
- **Teacher**: Create/manage own courses — publish/unpublish toggle
- **Student**: Browse published courses — enroll in premium courses via payment

#### Data Integrity
- `enrolledIds` is a `Set<number>` built from real `useEnrollments()` data
- Premium courses show lock icon + "Enroll · $X" button only if not enrolled
- Free courses show "Start" or "Continue" button based on enrollment status
- Course card shows real stats: `enrolled_count`, `lesson_count` (not mock `students`, `duration`, `rating`)

---

### 2. **payment.$courseId.tsx** — From Mock to Real API

#### Before
- Used mock course fields: `course.instructor`, `course.lessons`, `course.duration`, `course.rating`, `course.level`, `course.thumbnail`
- `courseId` param was a string but used directly without parsing
- `unlockCourse()` from context only updated local state — no real enrollment
- Payment method mapping was incorrect: `mock_telebirr` doesn't exist in backend enum
- No loading/error states for course fetch

#### After
- Uses `useCourse(numericId)` to fetch real course data
- `courseId` param parsed once: `const numericId = parseInt(courseId, 10)`
- Real fields used: `course.title`, `course.teacher_name`, `course.category`, `course.lesson_count`, `course.enrolled_count`, `course.price`, `course.thumbnail`
- Payment method mapping correct:
  ```typescript
  const METHOD_MAP: Record<Method, "mock_card" | "mock_bank" | "mock_wallet"> = {
    chapa:    "mock_card",
    telebirr: "mock_wallet",
    bank:     "mock_bank",
    card:     "mock_card",
  };
  ```
- `useInitiatePayment()` mutation handles:
  - Backend payment processing
  - Atomic enrollment creation (via `process_payment` service)
  - Cache invalidation: `enrollments`, `courses`, `payments`
- Loading state while fetching course
- Error state with fallback to courses page
- Success state shows real course title + payment details

#### Data Flow
1. Student navigates to `/payment/$courseId`
2. Course data fetched via `useCourse(numericId)`
3. Form pre-fills with `currentUser.full_name` and `currentUser.email`
4. Student selects payment method and submits
5. `useInitiatePayment()` calls backend `/payments/initiate/`
6. Backend atomically:
   - Creates `Payment` record (status=success)
   - Creates/updates `Enrollment` (status=active)
   - Fires notification via `transaction.on_commit()`
7. Frontend shows success screen
8. Student can click "Start learning" → `/lessons/$courseId`

---

### 3. **use-api.ts** — New Mutations Added

```typescript
export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof coursesApi.create>[0]) => coursesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function usePublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: "publish" | "unpublish" | "archive" | "reactivate" }) =>
      coursesApi.publish(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof paymentsApi.initiate>[0]) => paymentsApi.initiate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollments"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
```

---

## Architecture Decisions

### 1. **Server-Side Filtering**
- Query params (`search`, `category`, `status`) sent to backend
- Backend returns only relevant results
- Reduces payload, improves performance, enforces access control

### 2. **Atomic Enrollment**
- Payment + Enrollment creation happens in a single transaction
- No race conditions (TOCTOU mitigation via `transaction.atomic()`)
- Notification fires only after transaction commits

### 3. **Cache Invalidation Strategy**
- `useCreateCourse()` invalidates `["courses"]`
- `useDeleteCourse()` invalidates `["courses"]`
- `usePublishCourse()` invalidates `["courses"]`
- `useInitiatePayment()` invalidates `["enrollments"]`, `["courses"]`, `["payments"]`
- Ensures UI stays in sync with backend state

### 4. **Type Safety**
- All API responses typed against `ApiCourseListItem`, `ApiCourse`, `ApiEnrollment`, `ApiPayment`
- No `any` types — full TypeScript coverage
- Payment method enum validated at compile time

### 5. **Mobile-First UI**
- 1 column on mobile (full-width cards)
- 2 columns on tablet
- 3 columns on desktop
- Responsive filters stack vertically on mobile
- Order summary hidden on mobile, sticky on desktop

---

## Testing Checklist

### courses.tsx
- [ ] Admin can create, publish, unpublish, delete courses
- [ ] Teacher can create and manage their own courses
- [ ] Student sees only published courses
- [ ] Student can filter by category
- [ ] Student can search by title
- [ ] Premium courses show lock icon + "Enroll · $X" button
- [ ] Free courses show "Start" or "Continue" button
- [ ] Publish/unpublish toggle works for admin and teacher
- [ ] Delete confirmation dialog appears
- [ ] Loading state shows spinner
- [ ] Error state shows fallback message

### payment.$courseId.tsx
- [ ] Course data loads correctly
- [ ] Form pre-fills with user's name and email
- [ ] Payment method selector works
- [ ] Telebirr requires phone number
- [ ] Submit button disabled while processing
- [ ] Success screen shows course title and payment details
- [ ] "Start learning" button navigates to `/lessons/$courseId`
- [ ] "Browse more courses" button navigates to `/courses`
- [ ] Error state shows fallback message
- [ ] Back button navigates to `/courses`

---

## Backend Integration Points

### Endpoints Used
- `GET /api/v1/courses/` — list courses (with filters)
- `GET /api/v1/courses/{id}/` — get course detail
- `POST /api/v1/courses/` — create course
- `DELETE /api/v1/courses/{id}/` — delete course
- `POST /api/v1/courses/{id}/publish/` — publish/unpublish/archive
- `GET /api/v1/enrollments/` — list user's enrollments
- `POST /api/v1/payments/initiate/` — initiate payment

### Data Models
- `Course` (Django model) → `ApiCourseListItem` (TypeScript interface)
- `Enrollment` (Django model) → `ApiEnrollment` (TypeScript interface)
- `Payment` (Django model) → `ApiPayment` (TypeScript interface)

---

## Performance Optimizations

1. **Query Deduplication**: React Query deduplicates identical requests
2. **Stale Time**: Courses cached for 5 minutes (configurable)
3. **Selective Invalidation**: Only invalidate affected query keys
4. **Lazy Loading**: Course detail fetched only when needed
5. **Memoization**: `enrolledIds` and `categories` memoized to prevent unnecessary recalculations

---

## Security Considerations

1. **Role-Based Access**: Backend enforces permissions (teachers can only edit their courses)
2. **CSRF Protection**: Django CSRF token included in all mutations
3. **Authentication**: JWT token required for all requests
4. **Input Validation**: Backend validates all inputs (title, price, category)
5. **Atomic Transactions**: Payment + Enrollment creation is atomic (no partial states)
6. **Audit Logging**: All mutations logged in backend audit trail

---

## Future Enhancements

1. **Bulk Operations**: Admin bulk publish/unpublish courses
2. **Advanced Filtering**: Filter by teacher, enrollment count, price range
3. **Sorting**: Sort by created_at, enrolled_count, price
4. **Pagination**: Handle large course lists
5. **Real Chapa Integration**: Replace mock payment with real Chapa API
6. **Refund Handling**: Process refunds within 30-day window
7. **Course Analytics**: Show enrollment trends, revenue per course
8. **Discount Codes**: Apply coupon codes at checkout
