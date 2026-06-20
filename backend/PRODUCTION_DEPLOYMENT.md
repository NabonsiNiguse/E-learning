# Production Deployment Guide

**Version**: 2.0.0  
**Last Updated**: May 2026

---

## Pre-Deployment Checklist

### Database
- [ ] PostgreSQL 12+ installed and running
- [ ] Database created: `learnly_prod`
- [ ] Database user created with appropriate permissions
- [ ] Backups configured (daily)
- [ ] Connection pooling configured (PgBouncer)

### Environment
- [ ] Python 3.10+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Environment variables configured (see `.env.example`)
- [ ] Secret key generated and stored securely

### Security
- [ ] HTTPS/SSL certificates obtained
- [ ] CORS settings configured
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] API authentication tokens configured
- [ ] Database encryption enabled

### Monitoring
- [ ] Logging configured (Sentry/ELK)
- [ ] Error tracking enabled
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set

---

## Deployment Steps

### 1. Database Migrations

```bash
# Run all pending migrations
python manage.py migrate

# Verify migrations
python manage.py showmigrations

# Create initial data (grading scales, etc.)
python manage.py loaddata initial_data.json
```

### 2. Create Initial Grading Scale

```bash
python manage.py shell
```

```python
from results.models import GradingScale, GradingRule
from decimal import Decimal

scale = GradingScale.objects.create(
    name='Standard 2024',
    is_active=True,
)

rules = [
    ('A+', Decimal('95'), Decimal('100'), Decimal('4.0'), 'pass'),
    ('A',  Decimal('90'), Decimal('94.99'), Decimal('4.0'), 'pass'),
    ('B+', Decimal('85'), Decimal('89.99'), Decimal('3.5'), 'pass'),
    ('B',  Decimal('80'), Decimal('84.99'), Decimal('3.0'), 'pass'),
    ('C+', Decimal('75'), Decimal('79.99'), Decimal('2.5'), 'pass'),
    ('C',  Decimal('70'), Decimal('74.99'), Decimal('2.0'), 'pass'),
    ('D',  Decimal('60'), Decimal('69.99'), Decimal('1.0'), 'pass'),
    ('F',  Decimal('0'),  Decimal('59.99'), Decimal('0.0'), 'fail'),
]

for letter, min_score, max_score, gpa, pass_fail in rules:
    GradingRule.objects.create(
        scale=scale,
        letter=letter,
        min_score=min_score,
        max_score=max_score,
        gpa_points=gpa,
        pass_fail=pass_fail,
    )

print('Grading scale created successfully')
```

### 3. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 4. Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=results --cov-report=html

# Run specific test file
pytest backend/results/test_data_integration.py -v
```

### 5. Start Services

```bash
# Using Gunicorn
gunicorn myproject.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --worker-class sync \
  --timeout 60 \
  --access-logfile - \
  --error-logfile -

# Or using systemd service
systemctl start learnly-backend
systemctl enable learnly-backend
```

### 6. Verify Deployment

```bash
# Check API health
curl http://localhost:8000/api/v1/health/

# Check results endpoint
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/results/

# Check grading scales
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/results/grading-scales/
```

---

## Environment Variables

Create `.env` file:

```bash
# Django
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/learnly_prod

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Sentry (error tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API
API_RATE_LIMIT=1000/hour
```

---

## Systemd Service File

Create `/etc/systemd/system/learnly-backend.service`:

```ini
[Unit]
Description=Learnly Backend API
After=network.target postgresql.service

[Service]
Type=notify
User=learnly
Group=learnly
WorkingDirectory=/opt/learnly/backend
Environment="PATH=/opt/learnly/backend/venv/bin"
EnvironmentFile=/opt/learnly/backend/.env
ExecStart=/opt/learnly/backend/venv/bin/gunicorn \
  myproject.wsgi:application \
  --bind unix:/run/learnly/gunicorn.sock \
  --workers 4 \
  --timeout 60

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable learnly-backend
sudo systemctl start learnly-backend
```

---

## Nginx Configuration

Create `/etc/nginx/sites-available/learnly`:

```nginx
upstream learnly_backend {
    server unix:/run/learnly/gunicorn.sock fail_timeout=0;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 10M;

    location /api/ {
        proxy_pass http://learnly_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /static/ {
        alias /opt/learnly/backend/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias /opt/learnly/backend/media/;
        expires 7d;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/learnly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Database Backup Strategy

### Automated Daily Backups

Create `/opt/learnly/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/learnly"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="learnly_prod"
DB_USER="learnly"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

Add to crontab:

```bash
0 2 * * * /opt/learnly/backup.sh >> /var/log/learnly-backup.log 2>&1
```

### Restore from Backup

```bash
gunzip < /backups/learnly/db_20240515_020000.sql.gz | psql -U learnly learnly_prod
```

---

## Monitoring & Logging

### Sentry Configuration

```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_pii=False,
)
```

### Logging Configuration

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/learnly/backend.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
```

---

## Performance Tuning

### Database Connection Pooling

Install PgBouncer:

```bash
sudo apt-get install pgbouncer
```

Configure `/etc/pgbouncer/pgbouncer.ini`:

```ini
[databases]
learnly_prod = host=localhost port=5432 dbname=learnly_prod

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
```

### Django Caching

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Cache grading scales for 1 hour
GRADING_SCALE_CACHE_TIMEOUT = 3600
```

### Query Optimization

```python
# Use select_related for foreign keys
results = StudentResult.objects.select_related(
    'student', 'course', 'submitted_by', 'approved_by'
).all()

# Use prefetch_related for reverse relations
results = StudentResult.objects.prefetch_related('audit_logs', 'appeals').all()
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop the service
sudo systemctl stop learnly-backend

# 2. Revert code to previous version
cd /opt/learnly/backend
git checkout previous-tag

# 3. Revert database migrations (if needed)
python manage.py migrate results 0001_initial

# 4. Restart service
sudo systemctl start learnly-backend

# 5. Verify
curl http://localhost:8000/api/v1/health/
```

---

## Post-Deployment Verification

```bash
# 1. Check API health
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/results/

# 2. Verify database connectivity
python manage.py dbshell

# 3. Check logs
tail -f /var/log/learnly/backend.log

# 4. Run smoke tests
pytest backend/results/test_data_integration.py::ResultsAPITests -v

# 5. Monitor performance
# Check Sentry dashboard
# Check Nginx access logs
# Check database query performance
```

---

## Troubleshooting

### Issue: 502 Bad Gateway

```bash
# Check Gunicorn status
sudo systemctl status learnly-backend

# Check logs
sudo journalctl -u learnly-backend -n 50

# Restart service
sudo systemctl restart learnly-backend
```

### Issue: Database Connection Errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U learnly -d learnly_prod -c "SELECT 1"

# Check PgBouncer
sudo systemctl status pgbouncer
```

### Issue: High Memory Usage

```bash
# Check Gunicorn workers
ps aux | grep gunicorn

# Reduce worker count in systemd service
# Restart service
sudo systemctl restart learnly-backend
```

---

## Maintenance Tasks

### Weekly
- [ ] Review error logs in Sentry
- [ ] Check database size
- [ ] Verify backups completed

### Monthly
- [ ] Review performance metrics
- [ ] Update dependencies
- [ ] Run full test suite
- [ ] Review audit logs

### Quarterly
- [ ] Security audit
- [ ] Database optimization
- [ ] Capacity planning
- [ ] Disaster recovery drill

---

**Questions?** Contact DevOps team or refer to the Backend Upgrade Guide.
