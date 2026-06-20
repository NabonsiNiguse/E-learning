# UI Improvements for Results System

## Overview
Clear, unified UI for grade management with student appeal workflow and grade viewing.

## Pages & Components

### 1. Student Results Page
**Route:** `/results` or `/grades`

**Features:**
- View own grades and grade history
- See reasons for grade changes
- Submit grade appeals
- Track appeal status

**Layout:**
```
┌─────────────────────────────────────────┐
│ My Grades & Results                     │
├─────────────────────────────────────────┤
│                                         │
│ Grade Summary                           │
│ ├─ Current GPA: 3.85                   │
│ ├─ Courses: 5                          │
│ └─ Pending Appeals: 1                  │
│                                         │
│ Recent Grades                           │
│ ├─ Assignment 1: 85/100 (↑ from 75)   │
│ │  Reason: Recalculation - partial     │
│ │  Changed by: Jane Smith (Teacher)    │
│ │  Date: May 4, 2026                   │
│ │                                      │
│ ├─ Assignment 2: 92/100                │
│ │  No changes                          │
│ │                                      │
│ └─ [View All Grades]                   │
│                                         │
│ Active Appeals                          │
│ ├─ Appeal #1: Assignment 1             │
│ │  Status: Escalated (pending review)  │
│ │  Submitted: May 3, 2026              │
│ │  [View Details]                      │
│ │                                      │
│ └─ [Submit New Appeal]                 │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Grade Appeal Submission Modal
**Trigger:** "Submit New Appeal" button

**Form:**
```
┌─────────────────────────────────────────┐
│ Submit Grade Appeal                  [X]│
├─────────────────────────────────────────┤
│                                         │
│ Assignment: [Dropdown - select]         │
│ Current Grade: 75/100                   │
│                                         │
│ Your Reason:                            │
│ [Text area - min 20 chars]              │
│ "I believe my answer was correct       │
│  because..."                            │
│                                         │
│ [Cancel]  [Submit Appeal]               │
│                                         │
└─────────────────────────────────────────┘
```

**Validation:**
- Assignment required
- Reason required (min 20 chars)
- Only one active appeal per assignment
- Show error if appeal already exists

### 3. Appeal Status Timeline
**Shows:** Full appeal workflow

```
┌─────────────────────────────────────────┐
│ Appeal #1 - Assignment 1                │
├─────────────────────────────────────────┤
│                                         │
│ ✓ Submitted                             │
│   May 3, 2026 at 2:30 PM               │
│   Your reason: "I believe..."          │
│                                         │
│ ✓ Teacher Reviewed                      │
│   May 3, 2026 at 3:45 PM               │
│   Jane Smith (Teacher)                 │
│   Response: "I've reviewed your work..." │
│   Action: Escalated to Academic Manager│
│                                         │
│ ⏳ Awaiting Academic Manager Review     │
│   Escalated on May 3, 2026             │
│   Expected response: May 10, 2026      │
│                                         │
│ [Close]                                 │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Teacher Grade Management Page
**Route:** `/grade-management` (teacher only)

**Features:**
- View student grades
- Create grade corrections
- Review pending appeals
- Escalate appeals to Academic Manager

**Layout:**
```
┌─────────────────────────────────────────┐
│ Grade Management                        │
├─────────────────────────────────────────┤
│                                         │
│ [Course Selector] [Assignment Selector] │
│                                         │
│ Student Grades                          │
│ ┌─────────────────────────────────────┐ │
│ │ Student | Grade | Status | Actions │ │
│ ├─────────────────────────────────────┤ │
│ │ John D. │ 85    │ ✓      │ [Edit]  │ │
│ │ Jane S. │ 92    │ ✓      │ [Edit]  │ │
│ │ Bob T.  │ 78    │ 🔔     │ [Edit]  │ │
│ │         │       │ Appeal │ [Review]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Pending Appeals (3)                     │
│ ├─ Appeal #1: Bob T. - Assignment 1    │
│ │  Status: Pending                     │
│ │  [Review & Respond]                  │
│ │                                      │
│ ├─ Appeal #2: Alice M. - Assignment 2  │
│ │  Status: Pending                     │
│ │  [Review & Respond]                  │
│ │                                      │
│ └─ [View All Appeals]                  │
│                                         │
└─────────────────────────────────────────┘
```

### 5. Appeal Review Modal (Teacher)
**Trigger:** "Review & Respond" button

```
┌─────────────────────────────────────────┐
│ Review Appeal - Bob T.              [X] │
├─────────────────────────────────────────┤
│                                         │
│ Assignment: Assignment 1                │
│ Current Grade: 78/100                   │
│ Student's Reason:                       │
│ "I believe my answer was correct..."   │
│                                         │
│ Your Response:                          │
│ [Text area - required]                  │
│ "I've reviewed your work..."           │
│                                         │
│ Action:                                 │
│ ○ Mark as Reviewed (keep grade)        │
│ ○ Escalate to Academic Manager         │
│                                         │
│ [Cancel]  [Submit Response]             │
│                                         │
└─────────────────────────────────────────┘
```

### 6. Grade Correction Modal (Teacher)
**Trigger:** "Edit" button on grade

```
┌─────────────────────────────────────────┐
│ Correct Grade - John D.             [X] │
├─────────────────────────────────────────┤
│                                         │
│ Assignment: Assignment 1                │
│ Current Grade: 85/100                   │
│                                         │
│ New Grade: [Input field]                │
│ 90                                      │
│                                         │
│ Reason for Change:                      │
│ [Text area - required, min 20 chars]   │
│ "Recalculation - missed partial credit" │
│                                         │
│ [Cancel]  [Save Correction]             │
│                                         │
└─────────────────────────────────────────┘
```

### 7. Admin Appeal Override Modal (SuperAdmin)
**Trigger:** "Override" button on escalated appeal

```
┌─────────────────────────────────────────┐
│ Override Appeal - Bob T.            [X] │
├─────────────────────────────────────────┤
│                                         │
│ Assignment: Assignment 1                │
│ Current Grade: 78/100                   │
│ Teacher's Response: "I've reviewed..."  │
│                                         │
│ Decision:                               │
│ ○ Approve (update grade)               │
│ ○ Reject (keep current grade)          │
│                                         │
│ [If Approve selected]                   │
│ New Grade: [Input field]                │
│ 85                                      │
│                                         │
│ Reason for Decision:                    │
│ [Text area - required, min 20 chars]   │
│ "Upon review, the student's..."        │
│                                         │
│ [Cancel]  [Submit Decision]             │
│                                         │
└─────────────────────────────────────────┘
```

### 8. Grade History View
**Shows:** Complete audit trail

```
┌─────────────────────────────────────────┐
│ Grade History - Assignment 1            │
├─────────────────────────────────────────┤
│                                         │
│ Original Grade: 75/100                  │
│ Graded by: System                       │
│ Date: May 1, 2026                       │
│                                         │
│ ↓ Correction #1                         │
│ New Grade: 85/100                       │
│ Changed by: Jane Smith (Teacher)        │
│ Reason: "Recalculation - partial credit"│
│ Date: May 3, 2026                       │
│                                         │
│ ↓ Correction #2 (from Appeal #1)        │
│ New Grade: 90/100                       │
│ Changed by: Admin User (SuperAdmin)     │
│ Reason: "[Appeal #1 approved] Upon..."  │
│ Date: May 4, 2026                       │
│                                         │
│ Current Grade: 90/100                   │
│                                         │
│ [Close]                                 │
│                                         │
└─────────────────────────────────────────┘
```

## UI/UX Best Practices

### 1. Clear Status Indicators
- ✓ Approved/Resolved
- ⏳ Pending/In Progress
- ✗ Rejected/Denied
- 🔔 Requires Action

### 2. Color Coding
- **Green:** Approved, resolved, positive changes
- **Yellow:** Pending, awaiting action
- **Red:** Rejected, issues
- **Blue:** Informational

### 3. Workflow Clarity
- Show current step in appeal process
- Display expected timeline
- Indicate who needs to act next
- Show history of all changes

### 4. Error Prevention
- Confirm before submitting appeals
- Validate reason length
- Prevent duplicate appeals
- Show clear error messages

### 5. Accessibility
- Clear labels on all inputs
- Keyboard navigation support
- High contrast for status indicators
- Screen reader friendly

## Implementation Priority

1. **Phase 1 (MVP):**
   - Student grade viewing (`/results/my-grades`)
   - Appeal submission form
   - Appeal status tracking

2. **Phase 2:**
   - Teacher appeal review interface
   - Grade correction form
   - Grade history view

3. **Phase 3:**
   - Admin override interface
   - Advanced filtering/search
   - Export grades to CSV
   - Bulk grade operations

## API Integration

### Student Grade View
```typescript
const { data: grades } = await resultsApi.getMyGrades();
// Display in table with sorting/filtering
```

### Submit Appeal
```typescript
const { data: appeal } = await resultsApi.submitAppeal({
  submission_id: "sub_123",
  assignment_id: "asgn_1",
  reason: "I believe my answer was correct..."
});
```

### Teacher Review
```typescript
const { data: updated } = await resultsApi.reviewAppeal(appealId, {
  teacher_response: "I've reviewed your work...",
  action: "escalated"
});
```

### Admin Override
```typescript
const { data: updated } = await resultsApi.overrideAppeal(appealId, {
  action: "approved",
  override_score: 90,
  override_reason: "Upon review, the student's interpretation..."
});
```
