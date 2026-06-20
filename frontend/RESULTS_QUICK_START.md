# Results System — Quick Start Guide

## 🚀 Getting Started

### 1. **Start the Backend**
```bash
cd backend
python manage.py runserver
```

### 2. **Start the Frontend**
```bash
cd frontend
npm run dev
```

### 3. **Access the Application**
- Go to `http://localhost:5173`
- Click "Results" in the sidebar

---

## 👥 Test Accounts

### Teacher
- **Email**: `nabonsi@learnly.io`
- **Password**: `Teacher@1234`
- **View**: Score Entry dashboard with search/filter

### Student
- **Email**: `keab@learnly.io`
- **Password**: `Student@1234`
- **View**: My Results dashboard with appeals

### Admin
- **Email**: `ermiyas@learnly.io`
- **Password**: `Admin@1234`
- **View**: Results Management with full control

---

## 📋 Features by Role

### Teacher Dashboard
```
✅ Enter raw scores (0-100)
✅ Search students and courses
✅ Filter by course
✅ View completion statistics
✅ Submit scores to lock them
✅ Edit scores before submission
```

**Key Actions:**
1. Click edit icon to enter score
2. Type score (0-100)
3. Click save or cancel
4. Click submit to lock score
5. Confirm in dialog

---

### Student Dashboard
```
✅ View own results
✅ See scores, grades, GPA, pass/fail
✅ Filter by year and semester
✅ Search courses
✅ Submit grade appeals
✅ Export report
```

**Key Actions:**
1. Use filters to find courses
2. Search for specific course
3. Click appeal button to submit appeal
4. Enter reason and submit
5. Teacher will review

---

### Admin Dashboard
```
✅ View all results
✅ See all student data
✅ Approve results
✅ Unlock results
✅ Manage grading scales
✅ View audit logs
✅ Perform bulk actions
```

**Key Actions:**
1. Search/filter results
2. Click approve to approve result
3. Click unlock to unlock for correction
4. Click audit log to view history
5. Manage grading scales in tab

---

## 🎨 UI Components

### Stat Cards
- Gradient backgrounds with icons
- Real-time calculations
- Color-coded by status

### Search Bar
- Real-time search
- Searches across multiple fields
- Instant filtering

### Filter Dropdowns
- Status filter (Admin)
- Year/Semester filter (Student)
- Course filter (Teacher)

### Tables
- Sortable columns
- Hover effects
- Inline actions
- Responsive design

### Dialogs
- Confirmation dialogs
- Appeal submission
- Audit log viewer

---

## 🔐 Permission Enforcement

### Backend Level
- Serializers exclude fields by role
- API returns different data per role
- All checks enforced server-side

### Frontend Level
- Different components per role
- Different table structures
- Different available actions
- Different visible fields

---

## 📊 Data Displayed

### Teacher Sees
```
- Student Name
- Course Title
- Year & Semester
- Raw Score (editable)
- Submit Button
```

### Student Sees
```
- Course Title
- Course Teacher
- Raw Score
- Grade Letter
- GPA
- Pass/Fail Status
- Year & Semester
- Appeal Button
```

### Admin Sees
```
- Student Name & Email
- Course Title & Teacher
- Raw Score
- Grade Letter
- GPA
- Pass/Fail Status
- Result Status (Draft/Submitted/Approved/Unlocked)
- Submission Details
- Approval Details
- Unlock Details
- Audit Log
```

---

## 🎯 Common Tasks

### Teacher: Enter Scores
1. Go to Results → Score Entry
2. Search for student or course
3. Click edit icon next to score
4. Enter score (0-100)
5. Click save
6. Click submit to lock
7. Confirm in dialog

### Student: View Results
1. Go to Results → My Results
2. Use filters to find courses
3. Search for specific course
4. View score, grade, GPA, status
5. Click appeal button to appeal

### Student: Submit Appeal
1. Click appeal button on course
2. Enter reason for appeal
3. Click submit
4. Teacher will review
5. Check back for response

### Admin: Approve Results
1. Go to Results → Results Management
2. Filter by "Submitted" status
3. Click approve button
4. Result is approved
5. View audit log to confirm

### Admin: Unlock Result
1. Go to Results → Results Management
2. Find result to unlock
3. Click unlock button
4. Result is unlocked for correction
5. Teacher can edit again

---

## 🐛 Troubleshooting

### Backend Not Running
```
Error: net::ERR_CONNECTION_REFUSED
Solution: Start backend with: python manage.py runserver
```

### Frontend Not Loading
```
Error: Page not found
Solution: Make sure frontend is running: npm run dev
```

### Cannot See Results
```
Error: No results found
Solution: 
1. Make sure you're logged in
2. Check if backend has data
3. Try refreshing page
```

### Scores Not Saving
```
Error: Failed to save score
Solution:
1. Check score is 0-100
2. Check backend is running
3. Check network connection
```

---

## 📱 Responsive Design

- **Mobile**: Single column, stacked cards
- **Tablet**: 2-3 columns
- **Desktop**: Full multi-column layout
- **Large**: 5-6 column stat grid

---

## 🔄 Data Refresh

- Click "Refresh" button to reload data
- Data auto-refreshes after actions
- Search/filter updates instantly
- No page reload needed

---

## 💡 Tips & Tricks

1. **Search is powerful**: Search works across multiple fields
2. **Filters are fast**: Use filters to narrow down results
3. **Inline editing**: Edit scores directly in table
4. **Confirmation dialogs**: Always confirm important actions
5. **Toast notifications**: Check notifications for feedback
6. **Audit logs**: Admin can see complete change history
7. **Export reports**: Students can export results as report
8. **Bulk actions**: Admin can select multiple results

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the RESULTS_UI_UPGRADE.md for detailed info
3. Check browser console for errors
4. Check backend logs for API errors

---

## ✅ Verification Checklist

- [ ] Backend is running on localhost:8000
- [ ] Frontend is running on localhost:5173
- [ ] Can log in with test account
- [ ] Can see Results in sidebar
- [ ] Can see role-appropriate dashboard
- [ ] Can perform role-specific actions
- [ ] Search and filter work
- [ ] Data displays correctly
- [ ] No console errors
- [ ] Responsive on mobile
