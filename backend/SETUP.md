# Backend Setup

## Requirements
- Python 3.11+
- pip

## Quick Start

```bash
# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
# Edit .env — change SECRET_KEY for production

# 4. Apply migrations
python manage.py migrate

# 5. Seed sample data
python manage.py seed

# 6. Start development server
python manage.py runserver
```

API is available at: http://localhost:8000/api/v1/
Django Admin:        http://localhost:8000/admin/

## Seed Credentials
| Role    | Email                        | Password      |
|---------|------------------------------|---------------|
| Admin   | admin@elearn.com             | Admin@1234    |
| Teacher | alice.morgan@example.com     | Teacher@1234  |
| Teacher | bob.chen@example.com         | Teacher@1234  |
| Teacher | carol.james@example.com      | Teacher@1234  |
| Student | dan.smith@example.com        | Student@1234  |
| Student | eva.jones@example.com        | Student@1234  |

## Production Checklist
- Set `DEBUG=False` in `.env`
- Set a strong `SECRET_KEY`
- Switch `DB_ENGINE` to PostgreSQL
- Set `ALLOWED_HOSTS` to your domain
- Run `python manage.py collectstatic`
- Use gunicorn + nginx
