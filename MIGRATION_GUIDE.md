# Migration Guide: Grading → Results System

## Quick Start

```bash
# 1. Run migrations
cd backend
python manage.py migrate

# 2. Verify migration
python manage.py shell
>>> from results.models import GradeCorrection, GradeAppeal
>>> print(f"Corrections: {GradeCorrection.objects.count()}")
>>> print(f"Appeals: {GradeAppeal.objects.count()}")

# 3. Test endpoints
curl http://localhost:8000/api/v1/results/my-grades/

# 4. Update frontend (already done in api.ts)
# Just rebuild: npm run build
```

## Step-by-Step Migration

### Backend Setup

#### Step 1: Update Django Settings
✅ **Already done** in `backend/myproject/settings.py`
- Replaced `'grading.apps.GradingConfig'` with `'results.apps.ResultsConfig'`

#### Step 2: Update URL Routing
✅ **Already done** in `backend/myproject/urls.py`
- Changed `path('api/v1/grading/', ...)` to `path('api/v1/results/', ...)`

#### Step 3: Run Migrations
```bash
cd backend
python manage.py makemigrations results
python manage.py migrate results
```

**What happens:**
1. Creates `grade_corrections` table
2. Creates `grade_appeals` table
3. Runs migration `0002_migrate_from_grading.py` which:
   - Copies all data from `grad