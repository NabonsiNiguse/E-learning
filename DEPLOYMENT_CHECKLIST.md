# ✅ Deployment Checklist

## 🔍 Pre-Deployment Verification

### Backend Health Check
- [ ] Backend starts without errors: `python manage.py runserver`
- [ ] All migrations applied: `python manage.py migrate --check`
- [ ] No pending migrations: `python manage.py makemigrations --check --dry-run`
- [ ] Database seeded: `python manage.py seed` (or manual data entry)
- [ ] Admin panel accessible: http://localhost:8000/admin/
- [ ] API endpoints responding: `curl http://localhost:8000/api/v1/`
- [ ] No N+1 queries (check with Django Debug Toolbar)
- [ ] All tests passing: `python manage.py test`

### Frontend Health Check
- [ ] Frontend starts without errors: `npm run dev`
- [ ] No console errors in browser (F12)
- [ ] No TypeScript errors: `npm run build`
- [ ] All routes accessible
- [ ] API client configured correctly (`frontend/src/lib/api.ts`)
- [ ] Environment variables set (if using .env)
- [ ] Build succeeds: `npm run build`
- [ ] Linting passes: `npm run lint`

### Communication Check
- [ ] CORS configured: `CORS_ALLOWED_ORIGINS` in backend/.env
- [ ] Login works from frontend
- [ ] Dashboard loads data from backend
- [ ] Network tab shows successful API calls (200 status)
- [ ] No CORS errors in console
- [ ] Token refresh works automatically
- [ ] Logout clears tokens and redirects

### Performance Check
- [ ] Student dashboard: < 10 queries (was 40+)
- [ ] Attendance summary: < 5 queries (was 100+)
- [ ] Admin dashboard: < 10 queries (was 12+)
- [ ] Page load time: < 2 seconds
- [ ] API response time: < 500ms
- [ ] No memory leaks in frontend
- [ ] Database indexes created (if applicable)

---

## 🚀 Production Deployment

### Backend (Django)

#### 1. Environment Configuration
- [ ] Set `DEBUG=False` in production
- [ ] Generate strong `SECRET_KEY` (50+ characters)
- [ ] Configure `ALLOWED_HOSTS` with production domain
- [ ] Set `CORS_ALLOWED_ORIGINS` to production frontend URL
- [ ] Use environment variables for all secrets
- [ ] Configure database (PostgreSQL recommended)
- [ ] Set up Redis for caching (optional)

**Example production .env:**
```env
SECRET_KEY=<generate-with-django-secret-key-generator>
DEBUG=False
ALLOWED_HOSTS=api.yourdomain.com,yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379/0
```

#### 2. Database Setup
- [ ] Switch from SQLite to PostgreSQL
- [ ] Run migrations: `python manage.py migrate`
- [ ] Create superuser: `python manage.py createsuperuser`
- [ ] Set up database backups
- [ ] Configure connection pooling

#### 3. Static Files
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Configure `STATIC_ROOT` and `STATIC_URL`
- [ ] Set up CDN for static files (optional)
- [ ] Configure `MEDIA_ROOT` and `MEDIA_URL` for uploads

#### 4. Security
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set `SECURE_SSL_REDIRECT=True`
- [ ] Set `SESSION_COOKIE_SECURE=True`
- [ ] Set `CSRF_COOKIE_SECURE=True`
- [ ] Configure `SECURE_HSTS_SECONDS`
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable security headers

**Add to settings.py:**
```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
```

#### 5. Server Setup
- [ ] Install Gunicorn: `pip install gunicorn`
- [ ] Create Gunicorn config file
- [ ] Set up Nginx as reverse proxy
- [ ] Configure systemd service for auto-restart
- [ ] Set up logging (file-based or external service)
- [ ] Configure monitoring (Sentry, New Relic, etc.)

**Example Gunicorn command:**
```bash
gunicorn myproject.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --timeout 120 \
  --access-logfile /var/log/gunicorn/access.log \
  --error-logfile /var/log/gunicorn/error.log
```

**Example Nginx config:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /path/to/staticfiles/;
    }
    
    location /media/ {
        alias /path/to/media/;
    }
}
```

---

### Frontend (React + Vite)

#### 1. Environment Configuration
- [ ] Update API base URL to production
- [ ] Create `.env.production` file
- [ ] Remove development-only code
- [ ] Configure error tracking (Sentry)

**Create frontend/.env.production:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

**Update frontend/src/lib/api.ts:**
```typescript
const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
```

#### 2. Build Optimization
- [ ] Run production build: `npm run build`
- [ ] Check build size: `ls -lh dist/`
- [ ] Test production build locally: `npm run preview`
- [ ] Optimize images and assets
- [ ] Enable code splitting (already done with TanStack Router)
- [ ] Configure CDN for assets

#### 3. Deployment Options

**Option A: Static Hosting (Vercel, Netlify, Cloudflare Pages)**
- [ ] Connect Git repository
- [ ] Configure build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Add environment variables
- [ ] Configure redirects for SPA routing

**Example _redirects file (Netlify):**
```
/*    /index.html   200
```

**Example vercel.json:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Option B: Self-Hosted (Nginx)**
- [ ] Build: `npm run build`
- [ ] Copy `dist/` to server
- [ ] Configure Nginx to serve static files
- [ ] Set up HTTPS with Let's Encrypt

**Example Nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4. Performance Optimization
- [ ] Enable gzip/brotli compression
- [ ] Configure caching headers
- [ ] Use CDN for static assets
- [ ] Optimize images (WebP format)
- [ ] Lazy load images
- [ ] Preload critical resources

---

## 🔒 Security Checklist

### Backend
- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` (50+ characters)
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection protection (using ORM)
- [ ] XSS protection headers
- [ ] CSRF protection enabled
- [ ] Secure password hashing
- [ ] JWT token expiration configured
- [ ] Token blacklisting on logout
- [ ] Input validation on all endpoints
- [ ] File upload restrictions
- [ ] Database backups configured

### Frontend
- [ ] API keys not exposed in code
- [ ] HTTPS enabled
- [ ] Content Security Policy configured
- [ ] XSS protection
- [ ] No sensitive data in localStorage (only tokens)
- [ ] Token refresh mechanism working
- [ ] Logout clears all tokens
- [ ] Error messages don't expose sensitive info

---

## 📊 Monitoring & Logging

### Backend
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Performance monitoring (New Relic, DataDog)
- [ ] Database query monitoring
- [ ] API endpoint monitoring
- [ ] Server resource monitoring (CPU, memory, disk)
- [ ] Log aggregation (ELK stack, CloudWatch)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)

### Frontend
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Google Analytics, Vercel Analytics)
- [ ] User behavior tracking
- [ ] Core Web Vitals monitoring
- [ ] Console error monitoring

---

## 🧪 Post-Deployment Testing

### Functional Testing
- [ ] Login/logout works
- [ ] All user roles work correctly (admin, teacher, student)
- [ ] Dashboard loads data
- [ ] Course creation/editing works
- [ ] Enrollment process works
- [ ] Payment processing works (if applicable)
- [ ] Notifications are sent
- [ ] Messages can be sent/received
- [ ] Attendance tracking works
- [ ] File uploads work

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] Database queries optimized (< 10 per page)
- [ ] No memory leaks
- [ ] Handles concurrent users (load testing)

### Security Testing
- [ ] HTTPS working correctly
- [ ] CORS configured properly
- [ ] Authentication required for protected routes
- [ ] Authorization checks working (role-based access)
- [ ] No sensitive data exposed in responses
- [ ] Rate limiting working
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🔄 Continuous Deployment

### CI/CD Pipeline
- [ ] Set up GitHub Actions / GitLab CI / Jenkins
- [ ] Automated testing on push
- [ ] Automated deployment on merge to main
- [ ] Database migration automation
- [ ] Rollback strategy defined
- [ ] Blue-green deployment (optional)

**Example GitHub Actions workflow:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && git pull && pip install -r requirements.txt && python manage.py migrate && systemctl restart gunicorn'
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and deploy
        run: |
          cd frontend
          npm install
          npm run build
          # Deploy to Vercel/Netlify/S3
```

---

## 📝 Documentation

- [ ] API documentation updated
- [ ] Deployment guide written
- [ ] Environment variables documented
- [ ] Architecture diagram created
- [ ] Troubleshooting guide available
- [ ] User manual created (if needed)

---

## 🎯 Launch Checklist

### Day Before Launch
- [ ] Final code review
- [ ] All tests passing
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] Backup strategy tested
- [ ] Rollback plan documented
- [ ] Team briefed on launch plan

### Launch Day
- [ ] Deploy backend to production
- [ ] Run database migrations
- [ ] Deploy frontend to production
- [ ] Verify all services running
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Announce launch to users

### Post-Launch (First Week)
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Plan for next iteration

---

## 🆘 Rollback Plan

If something goes wrong:

1. **Immediate Actions**
   - [ ] Stop deployment
   - [ ] Assess impact
   - [ ] Notify team

2. **Backend Rollback**
   ```bash
   git checkout <previous-commit>
   python manage.py migrate <previous-migration>
   systemctl restart gunicorn
   ```

3. **Frontend Rollback**
   - Revert to previous deployment on hosting platform
   - Or: `git checkout <previous-commit> && npm run build && deploy`

4. **Database Rollback**
   - Restore from backup (if schema changed)
   - Or: Run reverse migrations

5. **Post-Rollback**
   - [ ] Verify system working
   - [ ] Investigate root cause
   - [ ] Document incident
   - [ ] Plan fix

---

## ✅ Final Verification

Before marking deployment as complete:

- [ ] All checklist items completed
- [ ] Production site accessible
- [ ] All critical features working
- [ ] No errors in logs
- [ ] Performance metrics acceptable
- [ ] Security measures in place
- [ ] Monitoring active
- [ ] Team notified of successful deployment
- [ ] Documentation updated
- [ ] Celebration! 🎉
