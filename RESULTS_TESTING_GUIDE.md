# Results Page — Testing Guide

## Quick Start

### URL
```
http://localhost:5173/results-unified
```

---

## Testing by Role

### 👨‍🏫 Teacher Testing

**Login**: teacher@example.com / password

**Expected View**: "Score Entry" Dashboard

**Table Structure**:
```
┌─────────────┬──────────────┬──────────────┬─────────┐
│ Student     │ Course       │ Score (0–100)│ Actions │
├─────────────┼──────────────┼──────────────┼─────────┤
│ John Doe    │ Math 101     │ 87.5%        │ Edit    │
│ Jane Smith  │ Math 101     │ —            │ —       │
└─────────────┴──────────────┴──────────────┴─────────┘
```

**What You Should See**:
- ✅ Student names
- ✅ Course titles
- ✅ Raw scores (0-100)
- ✅ Edit button
- ✅ Submit button
- ✅ Stats: Total Students, With Scores, Pending

**What You Should NOT See**:
- ❌ Grade column
- ❌ GPA column
- ❌ Final score column
- ❌ Status column

**Actions to Test**:
1. Click Edit button on a score
2. Enter a number 0-100
3. Click Save
4. See "Score saved" toast
5. Click Submit button
6. See confirmation dialog
7. Click Submit in dialog
8. See "Result submitted and locked" toast
9. Try to edit again → should be locked

---

### 👨‍🎓 Student Testing

**Login**: student@example.com / password

**Expected View**: "My Results" Dashboard

**Table Structure**:
```
┌──────────────┬───────┬───────┬─────┬────────┬──────────┐
│ Course       │ Score │ Grade │ GPA │ Status │ Period   │
├──────────────┼───────┼───────┼─────┼────────┼──────────┤
│ Math 101     │ 87.5% │ B+    │ 3.3 │ Pass   │ 2024 S1  │
│ English 101  │ 92.0% │ A-    │ 3.7 │ Pass   │ 2024 S1  │
└──────────────┴───────┴───────┴─────┴────────┴──────────┘
```

**What You Should See**:
- ✅ Course titles
- ✅ Raw scores
- ✅ Grade letters (A+, A, B+, etc.)
- ✅ GPA points (4.0, 3.3, 3.0, etc.)
- ✅ Pass/Fail status
- ✅ Year and semester
- ✅ Stats: Total Courses, Average GPA, Passed, Failed
- ✅ Year filter
- ✅ Semester filter
- ✅ Export button

**What You Should NOT See**:
- ❌ Student names
- ❌ Submission details
- ❌ Other students' results
- ❌ Edit buttons

**Actions to Test**:
1. See stats at top
2. Filter by year → results update
3. Filter by semester → results update
4. See grade color coding (green for A, blue for B, etc.)
5. See pass/fail icons
6. Try to click on a cell → should be read-only
7. Click Export button → should show toast

---

### 👨‍💼 Admin Testing

**Login**: admin@example.com / password

**Expected View**: "Results Management" Dashboard

**Table Structure**:
```
┌──────────────┬──────────────┬───────┬───────┬─────┬──────────┬─────────────┐
│ Student      │ Course       │ Score │ Grade │ GPA │ Status   │ Actions     │
├──────────────┼──────────────┼───────┼───────┼─────┼──────────┼─────────────┤
│ John Doe     │ Math 101     │ 87.5% │ B+    │ 3.3 │ Submitted│ Approve     │
│ Jane Smith   │ Math 101     │ 92.0% │ A-    │ 3.7 │ Approved │ Unlock      │
└──────────────┴──────────────┴───────┴───────┴─────┴──────────┴─────────────┘
```

**What You Should See**:
- ✅ All student names
- ✅ All course titles
- ✅ All scores
- ✅ All grades
- ✅ All GPA values
- ✅ Status (Draft, Submitted, Approved, Unlocked)
- ✅ Approve button (for submitted results)
- ✅ Unlock button (for non-draft results)
- ✅ Audit log button
- ✅ Stats: Total Results, Draft, Submitted, Approved, Active Scale
- ✅ Grading Scales tab
- ✅ New Scale button

**What You Should See in Grading Scales Tab**:
- ✅ Scale name
- ✅ Number of rules
- ✅ Active badge (if active)
- ✅ Edit button
- ✅ Rules list with:
  - Letter grade (A+, A, B+, etc.)
  - Score range (95-100, 90-94.99, etc.)
  - GPA points (4.0, 3.3, 3.0, etc.)
  - Pass/Fail status

**Actions to Test**:
1. See stats at top
2. Click Approve button on a submitted result
3. See "Result approved" toast
4. See status changed to "Approved"
5. Click Unlock button
6. See "Result unlocked" toast
7. See status changed to "Unlocked"
8. Click Audit log button (info icon)
9. See audit log dialog with:
   - Action (created, updated, submitted, approved, unlocked)
   - Performed by (user name and role)
   - Timestamp
   - Old value and new value
10. Click Grading Scales tab
11. See active scale
12. See all rules
13. Click Edit button on scale
14. Click New Scale button

---

## Verification Checklist

### Teacher View
- [ ] URL: `/results-unified`
- [ ] Title: "Score Entry"
- [ ] Subtitle: "Enter raw scores (0–100) for your students..."
- [ ] Stats: Total Students, With Scores, Pending
- [ ] Info banner: "Score Entry Only"
- [ ] Table columns: Student, Course, Score (0–100), Actions
- [ ] NO grade column
- [ ] NO GPA column
- [ ] NO final score column
- [ ] NO status column
- [ ] Edit button works
- [ ] Save button works
- [ ] Cancel button works
- [ ] Submit button works
- [ ] Confirmation dialog appears
- [ ] Score validation (0-100)
- [ ] Toast messages appear

### Student View
- [ ] URL: `/results-unified`
- [ ] Title: "My Results"
- [ ] Subtitle: "View your grades and academic performance"
- [ ] Stats: Total Courses, Average GPA, Passed, Failed
- [ ] Filters: Year, Semester
- [ ] Table columns: Course, Score, Grade, GPA, Status, Period
- [ ] Grade color coding works
- [ ] Pass/Fail icons appear
- [ ] Year filter works
- [ ] Semester filter works
- [ ] Export button appears
- [ ] Table is read-only (no edit buttons)
- [ ] Only own results visible
- [ ] Toast messages appear

### Admin View
- [ ] URL: `/results-unified`
- [ ] Title: "Results Management"
- [ ] Subtitle: "Full control: manage grading rules..."
- [ ] Stats: Total Results, Draft, Submitted, Approved, Active Scale
- [ ] Tabs: Results, Grading Scales
- [ ] Table columns: Student, Course, Score, Grade, GPA, Status, Actions
- [ ] Approve button appears (for submitted)
- [ ] Unlock button appears (for non-draft)
- [ ] Audit log button appears
- [ ] Approve button works
- [ ] Unlock button works
- [ ] Audit log dialog appears
- [ ] Grading Scales tab shows scales
- [ ] New Scale button appears
- [ ] Edit button appears on scales
- [ ] Rules display correctly
- [ ] Toast messages appear

---

## Common Issues & Solutions

### Issue: 404 on `/results-unified`
**Solution**: Ensure route is registered. Check `frontend/src/routes/results-unified.tsx` exists.

### Issue: Teacher sees grades
**Solution**: 
1. Check `TeacherResultsStrict` component
2. Verify table headers don't include grade columns
3. Check API response doesn't include grade fields

### Issue: Student sees other students' results
**Solution**:
1. Check `StudentResultsStrict` component
2. Verify API filters by `student=request.user`
3. Check backend `get_queryset()` method

### Issue: Admin can't approve results
**Solution**:
1. Check `approveResult()` function in API client
2. Verify backend `/results/{id}/approve/` endpoint exists
3. Check admin has permission

### Issue: Scores not saving
**Solution**:
1. Check `updateResultScore()` function
2. Verify backend `/results/{id}/` PATCH endpoint works
3. Check score validation (0-100)

### Issue: Filters not working
**Solution**:
1. Check `getResults()` function accepts params
2. Verify backend filters by year/semester
3. Check filter values are passed correctly

---

## Performance Testing

### Load Time
- [ ] Teacher view loads in < 2 seconds
- [ ] Student view loads in < 2 seconds
- [ ] Admin view loads in < 3 seconds

### Responsiveness
- [ ] Edit score input is responsive
- [ ] Submit button responds immediately
- [ ] Filters update results immediately
- [ ] Approve/Unlock buttons respond immediately

### Mobile
- [ ] Teacher view works on mobile
- [ ] Student view works on mobile
- [ ] Admin view works on mobile (may need horizontal scroll)

---

## Security Testing

### Teacher
- [ ] Cannot see grades
- [ ] Cannot see GPA
- [ ] Cannot see final score
- [ ] Cannot see status
- [ ] Cannot see other teachers' students
- [ ] Cannot edit locked results

### Student
- [ ] Cannot see other students' results
- [ ] Cannot edit results
- [ ] Cannot see submission details
- [ ] Cannot see status

### Admin
- [ ] Can see all results
- [ ] Can approve results
- [ ] Can unlock results
- [ ] Can view audit log
- [ ] Can manage grading scales

---

## API Testing

### Teacher Endpoints
```bash
# Get results (teacher sees only scores)
GET /api/v1/results/
Authorization: Bearer <teacher_token>

# Response should include: id, student_name, course_title, year, semester, raw_score
# Response should NOT include: grade_letter, gpa, pass_fail, status
```

### Student Endpoints
```bash
# Get results (student sees own results with grades)
GET /api/v1/results/
Authorization: Bearer <student_token>

# Response should include: id, course_title, course_teacher, year, semester, raw_score, grade_letter, gpa, pass_fail
# Response should NOT include: status, submitted_at, approved_at
```

### Admin Endpoints
```bash
# Get results (admin sees all data)
GET /api/v1/results/
Authorization: Bearer <admin_token>

# Response should include: ALL fields including status, submitted_at, approved_at, unlocked_at, created_at, updated_at
```

---

## Conclusion

The Results page is fully implemented with strict role-based behavior. Each role sees a completely different view with different columns, different functionality, and different controls.

**Status: ✅ READY FOR TESTING**

