# Grading & Results System Consolidation

## Overview
Consolidated the fragmented grading system into a unified **Results API** that handles:
- Grade corrections (teacher/admin)
- Grade appeals (student workflow)
- Student grade viewing
- Audit trail and permissions

## Changes Made

### Backend

#### 1. Created New `results` App
- **Location:** `backend/results/`
- **Models:** `GradeCorrection`, `GradeAppeal` (migrated from `grading` app)
- **Views:** Unified endpoints for all grade management
- **Serializers:** Consistent data formatting with nested user details
- **URLs:** Clean, RESTful endpoints under `/api/v1/results/`

#### 2. Removed Duplicate `grading` App
- **Old location:** `backend/grading/` (deprecated)
- **Status:** Can be safely deleted after migration
- **Migration:** Automatic data migration from `grading` → `results` via migration `0002_migrate_from_grading.py`

#### 3. Updated Django Settings
- **File:** `backend/myproject/settings.py`
- **Change:** Replaced `'grading.apps.GradingConfig'` with `'results.apps.ResultsConfig'` in `INSTALLED_APPS`

#### 4. Updated URL Routing
- **File:** `backend/myproject/urls.py`
- **Change:** Replaced `path('api/v1/grading/', ...)` with `path('api/v1/results/', ...)`

### Frontend

#### 1. Updated API Client
- **File:** `frontend/src/lib/api.ts`
- **Changes:**
  - Renamed `gradingApi` → `resultsApi`
  - Updated all endpoints from `/grading/` → `/results/`
  - Added new `getMyGrades()` endpoint for students
  - Kept `gradingApi` as backward-compatible alias

#### 2. New Endpoints
- `GET /api/v1/results/my-grades/` - Student views own grades
- `GET /api/v1/results/corrections/` - List grade corrections
- `POST /api/v1/results/corrections/` - Create grade correction
- `GET /api/v1/results/appeals/` - List appeals (role-filtered)
- `POST /api/v1/results/appeals/` - Submit appeal
- `PATCH /api/v1/results/appeals/<id>/review/` - Teacher reviews appeal
- `PATCH /api/v1/results/appeals/<id>/override/` - SuperAdmin overrides appeal

## API Workflow

### Student Grade Appeal Process
```
1. Student submits appeal
   POST /api/v1/results/appeals/
   
2. Teacher reviews
   PATCH /api/v1/results/appeals/<id>/review/
   - Action: "reviewed" or "escalated"
   
3. If escalated, SuperAdmin decides
   PATCH /api/v1/results/appeals/<id>/override/
   - Action: "approved" or "rejected"
   - If approved: auto-creates GradeCorrection audit record
```

### Student Views Grades
```
GET /api/v1/results/my-grades/
- Returns all grade corrections for authenticated student
- Shows grade history with reasons for changes
```

## Permission Matrix

| Action | Student | Teacher | Admin | SuperAdmin |
|--------|---------|---------|-------|-----------|
| View own grades | ✅ | ❌ | ❌ | ❌ |
| Submit appeal | ✅ | ❌ | ❌ | ❌ |
| View own appeals | ✅ | ❌ | ❌ | ❌ |
| Review appeals (own course) | ❌ | ✅ | ❌ | ❌ |
| View all appeals | ❌ | ❌ | ✅ | ✅ |
| Override appeals | ❌ | ❌ | ❌ | ✅ |
| Create corrections | ❌ | ✅ | ❌ | ✅ |
| View corrections | ❌ | ✅ | ✅ | ✅ |

## Data Migration

### Automatic Migration
When you run `python manage.py migrate`:
1. Creates new `results` app tables
2. Automatically copies data from `grading` app (if it exists)
3. Preserves all IDs, timestamps, and relationships

### Manual Steps
```bash
# 1. Run migrations
python manage.py migrate

# 2. Verify data was migrated
python manage.py shell
>>> from results.models import GradeCorrection, GradeAppeal
>>> GradeCorrection.objects.count()  # Should match grading app count
>>> GradeAppeal.objects.count()

# 3. (Optional) Delete old grading app
rm -rf backend/grading/
```

## Key Features

### 1. Grade Corrections
- Immutable audit trail (corrections are stacked, not edited)
- Teachers can only correct grades for their own courses
- SuperAdmins can correct any grade
- Requires reason for audit compliance

### 2. Grade Appeals
- 5-status workflow: PENDING → REVIEWED → ESCALATED → APPROVED/REJECTED
- Teacher reviews first (can resolve or escalate)
- SuperAdmin makes final decision on escalated appeals
- Automatic GradeCorrection created when appeal approved
- One active appeal per submission per student

### 3. Student Grade Viewing
- Students can view their own grades via `/api/v1/results/my-grades/`
- Shows complete grade history with change reasons
- Can see which teacher/admin made changes and when

### 4. Audit Trail
- All grade changes logged with:
  - Who made the change (teacher/admin)
  - When it was made
  - Reason for the change
  - Old and new scores
- Appeals include full workflow history

## Frontend Updates Needed

### Components to Update
1. **Grade Management Page** - Update API calls from `gradingApi` → `resultsApi`
2. **Student Results Page** - Add new `getMyGrades()` call
3. **Appeal Submission** - Use new `/results/appeals/` endpoint
4. **Grade History** - Display grade corrections with reasons

### Example Usage
```typescript
// Old (still works via alias)
import { gradingApi } from '@/lib/api';
const appeals = await gradingApi.listAppeals();

// New (recommended)
import { resultsApi } from '@/lib/api';
const myGrades = await resultsApi.getMyGrades();
const appeals = await resultsApi.listAppeals();
```

## Removed/Deprecated

### Removed
- `backend/grading/` app (can be deleted after migration)
- `backend/grades/` app (was empty, never used)

### Deprecated
- Old `/api/v1/grading/` endpoints (replaced by `/api/v1/results/`)
- `gradingApi` (kept as alias for backward compatibility)

## Testing Checklist

- [ ] Run migrations: `python manage.py migrate`
- [ ] Verify data migrated: Check record counts in results app
- [ ] Test student grade viewing: `GET /api/v1/results/my-grades/`
- [ ] Test appeal submission: `POST /api/v1/results/appeals/`
- [ ] Test teacher review: `PATCH /api/v1/results/appeals/<id>/review/`
- [ ] Test SuperAdmin override: `PATCH /api/v1/results/appeals/<id>/override/`
- [ ] Test grade correction creation: `POST /api/v1/results/corrections/`
- [ ] Verify permissions enforced correctly
- [ ] Check audit trail created for all changes
- [ ] Test frontend API calls with new endpoints

## Documentation

- **Backend API:** `backend/results/API_EXAMPLES.md`
- **Models:** `backend/results/models.py` (with docstrings)
- **Views:** `backend/results/views.py` (with permission matrix)
- **Frontend API:** `frontend/src/lib/api.ts` (with types)

## Next Steps

1. **Run migrations** to create results app and migrate data
2. **Update frontend components** to use new `resultsApi`
3. **Test all workflows** (appeal submission, teacher review, admin override)
4. **Delete old grading app** once verified everything works
5. **Update documentation** with new endpoint URLs
