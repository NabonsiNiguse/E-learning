# Results System — Quick Reference

## URL
```
http://localhost:5173/results-unified
```

---

## Teacher Dashboard

**What You See:**
```
┌─────────────┬──────────────┬──────────────┬─────────┐
│ Student     │ Course       │ Score (0–100)│ Actions │
├─────────────┼──────────────┼──────────────┼─────────┤
│ John Doe    │ Math 101     │ 87.5%        │ ✏️ ✓    │
│ Jane Smith  │ Math 101     │ —            │ —       │
└─────────────┴──────────────┴──────────────┴─────────┘
```

**What You Can Do:**
- ✅ Edit scores (0-100)
- ✅ Save scores
- ✅ Submit scores (locks them)
- ✅ See stats (Total, With Scores, Pending)

**What You Cannot Do:**
- ❌ See grades
- ❌ See GPA
- ❌ See final scores
- ❌ Edit grades
- ❌ See other teachers' students

---

## Student Dashboard

**What You See:**
```
┌──────────────┬───────┬───────┬─────┬────────┬──────────┬────────┐
│ Course       │ Score │ Grade │ GPA │ Status │ Period   │ Appeal │
├──────────────┼───────┼───────┼─────┼────────┼──────────┼────────┤
│ Math 101     │ 87.5% │ B+    │ 3.3 │ Pass   │ 2024 S1  │ 💬    │
│ English 101  │ 92.0% │ A-    │ 3.7 │ Pass   │ 2024 S1  │ 💬    │
└──────────────┴───────┴───────┴─────┴────────┴──────────┴────────┘
```

**What You Can Do:**
- ✅ View own results
- ✅ See grades (computed automatically)
- ✅ See GPA (computed automatically)
- ✅ See pass/fail status
- ✅ Filter by year
- ✅ Filter by semester
- ✅ Submit appeal for any grade
- ✅ Export results

**What You Cannot Do:**
- ❌ Edit results
- ❌ See other students' results
- ❌ See submission details

---

## Admin Dashboard

**What You See:**
```
┌──────────────┬──────────────┬───────┬───────┬─────┬──────────┬──────────────┐
│ Student      │ Course       │ Score │ Grade │ GPA │ Status   │ Actions      │
├──────────────┼──────────────┼───────┼───────┼─────┼──────────┼──────────────┤
│ John Doe     │ Math 101     │ 87.5% │ B+    │ 3.3 │ Submitted│ ✓ Approve    │
│ jane@ex.com  │              │       │       │     │          │ 🔓 Unlock    │
│              │              │       │       │     │          │ 📋 Audit Log │
├──────────────┼──────────────┼───────┼───────┼─────┼──────────┼──────────────┤
│ Jane Smith   │ Math 101     │ 92.0% │ A-    │ 3.7 │ Approved │ 🔓 Unlock    │
│ jane@ex.com  │              │       │       │     │          │ 📋 Audit Log │
└──────────────┴──────────────┴───────┴───────┴─────┴──────────┴──────────────┘
```

**What You Can Do:**
- ✅ View all results
- ✅ Approve submitted results
- ✅ Unlock results for correction
- ✅ View audit log
- ✅ Manage grading scales
- ✅ Create new scales
- ✅ Edit scales
- ✅ View all rules
- ✅ See all students and courses

**What You Can See:**
- ✅ All scores
- ✅ All grades
- ✅ All GPA values
- ✅ All statuses
- ✅ Submission details
- ✅ Approval details
- ✅ Audit trail

---

## Workflow

### Teacher → Student → Admin

```
1. TEACHER ENTERS SCORES
   ├─ Edit score (0-100)
   ├─ Save score
   └─ Submit score (locks it)
        ↓
2. SYSTEM CALCULATES GRADE
   ├─ Fetches active GradingScale
   ├─ Finds matching rule
   └─ Computes grade, GPA, pass/fail
        ↓
3. STUDENT VIEWS RESULT
   ├─ Sees score
   ├─ Sees grade (computed)
   ├─ Sees GPA (computed)
   ├─ Sees pass/fail status
   └─ Can submit appeal (optional)
        ↓
4. TEACHER REVIEWS APPEAL (optional)
   ├─ Reads student's reason
   └─ Responds to appeal
        ↓
5. ADMIN APPROVES RESULT
   ├─ Reviews submitted result
   ├─ Approves or unlocks
   └─ Logs action in audit trail
```

---

## Key Features

### Score Entry (Teacher)
- Inline editing
- Save/Cancel buttons
- Submit with confirmation
- Validation (0-100)
- Locked after submission

### Results Viewing (Student)
- Own results only
- Computed grades
- Computed GPA
- Pass/Fail status
- Year/Semester filters
- Grade color coding
- Pass/Fail icons

### Grade Appeals (Student)
- Appeal button for each result
- Dialog with reason input
- Teacher review
- Admin approval/rejection

### Results Management (Admin)
- Approve submitted results
- Unlock results for correction
- View audit log
- Manage grading scales
- Create/Edit scales

---

## Data Visible by Role

| Field | Teacher | Student | Admin |
|-------|---------|---------|-------|
| Student Name | ✅ | ❌ | ✅ |
| Course | ✅ | ✅ | ✅ |
| Score | ✅ | ✅ | ✅ |
| Grade | ❌ | ✅ | ✅ |
| GPA | ❌ | ✅ | ✅ |
| Status | ❌ | ✅ | ✅ |
| Period | ✅ | ✅ | ✅ |
| Submission Details | ❌ | ❌ | ✅ |
| Audit Log | ❌ | ❌ | ✅ |

---

## Common Actions

### Teacher: Enter Score
1. Click Edit button
2. Enter score (0-100)
3. Click Save
4. See "Score saved" toast

### Teacher: Submit Score
1. Click Submit button
2. Confirm in dialog
3. See "Result submitted and locked" toast
4. Score is now locked

### Student: View Results
1. See all own results
2. Filter by year (optional)
3. Filter by semester (optional)
4. See grades, GPA, pass/fail

### Student: Submit Appeal
1. Click Appeal button
2. Enter reason
3. Click "Submit Appeal"
4. See "Appeal submitted" toast
5. Teacher will review

### Admin: Approve Result
1. Click Approve button
2. See "Result approved" toast
3. Status changes to "Approved"

### Admin: Unlock Result
1. Click Unlock button
2. See "Result unlocked" toast
3. Status changes to "Unlocked"
4. Teacher can edit again

### Admin: View Audit Log
1. Click Audit Log button
2. See all changes
3. See who made changes
4. See when changes were made

---

## Validation Rules

### Score Entry
- Must be 0-100
- Cannot be empty for submission
- Decimal values allowed (e.g., 87.5)

### Grade Appeal
- Reason required
- Cannot be empty
- Can be submitted once per result

---

## Status Values

| Status | Meaning | Can Edit | Can Approve | Can Unlock |
|--------|---------|----------|-------------|-----------|
| Draft | Not submitted | ✅ | ❌ | ❌ |
| Submitted | Locked by teacher | ❌ | ✅ | ✅ |
| Approved | Finalized | ❌ | ❌ | ✅ |
| Unlocked | Unlocked by admin | ✅ | ✅ | ❌ |

---

## Grade Scale Example

| Grade | Score Range | GPA | Pass/Fail |
|-------|-------------|-----|-----------|
| A+ | 95-100 | 4.0 | Pass |
| A | 90-94.99 | 4.0 | Pass |
| B+ | 85-89.99 | 3.3 | Pass |
| B | 80-84.99 | 3.0 | Pass |
| C+ | 75-79.99 | 2.7 | Pass |
| C | 70-74.99 | 2.3 | Pass |
| D | 60-69.99 | 1.0 | Pass |
| F | 0-59.99 | 0.0 | Fail |

---

## Tips

### For Teachers
- Enter scores as soon as possible
- Submit scores to lock them
- Cannot edit after submission (admin must unlock)
- Grades are calculated automatically

### For Students
- Check results regularly
- Filter by year/semester to find specific results
- Submit appeal if you disagree with grade
- Teacher will review your appeal

### For Admins
- Review submitted results
- Approve to finalize
- Unlock if teacher needs to make changes
- Check audit log for history
- Manage grading scales

---

## Troubleshooting

### Issue: Cannot edit score
**Solution**: Score is locked. Admin must unlock it.

### Issue: Grade not showing
**Solution**: Score must be entered first. Grade is calculated automatically.

### Issue: Appeal not submitted
**Solution**: Reason field is required. Enter a reason and try again.

### Issue: Cannot approve result
**Solution**: Result must be in "Submitted" status. Check status first.

---

## Support

For questions or issues:
1. Check this quick reference
2. Read RESULTS_SYSTEM_COMPLETE.md for detailed info
3. Check backend logs for API errors
4. Verify user role is correct

---

