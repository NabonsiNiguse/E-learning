# 🎓 E-Learning Platform

A full-stack learning management system (LMS) built with Django REST Framework and React.

## ✨ Features

- 👥 **Multi-role System**: Admin, Teacher, and Student roles
- 📚 **Course Management**: Create, edit, and publish courses with lessons
- 📝 **Assignments & Quizzes**: Interactive learning assessments
- 📊 **Progress Tracking**: Monitor student learning progress
- 💬 **Messaging System**: Direct messages and announcements
- 🔔 **Notifications**: Real-time updates for users
- 💳 **Payment Integration**: Premium course enrollment
- 📅 **Attendance Tracking**: Monitor student attendance
- 📈 **Analytics Dashboard**: Role-specific insights and statistics

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- pip and npm

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd elearning-platform
```

2. **Start development servers**

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
./start-dev.sh
```

3. **Access the application**
- Frontend: http://localhost:5173/
- Backend API: http://localhost:8000/api/v1/
- Admin Panel: http://localhost:8000/admin/

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@elearn.com | admin123 |
| Teacher | alice.morgan@example.com | teacher123 |
| Student | dan.smith@example.com | student123 |

## 📖 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in minutes
- **[Architecture Overview](ARCHITECTURE.md)** - System design and data flow
- **[Backend-Frontend Communication](BACKEND_FRONTEND_COMMUNICATION.md)** - API integration guide
- **[Performance Fixes](PERFORMANCE_FIX_SUMMARY.md)** - Optimization details
- **[Debug Guide](DEBUG_PERFORMANCE.md)** - Performance monitoring

## 🛠️ Technology Stack

### Backend
- **Django 5.x** - Web framework
- **Django REST Framework** - API development
- **SimpleJWT** - JWT authentication
- **SQLite** - Database (development)
- **django-cors-headers** - CORS handling

### Frontend
- **React 19** - UI library
- **Vite 7** - Build tool
- **TanStack Router** - Routing
- **Tailwind CSS 4** - Styling
- **Radix UI** - Component primitives
- **React Hook Form + Zod** - Form handling

## 📁 Project Structure

```
.
├── backend/                 # Django REST API
│   ├── users/              # User management & authentication
│   ├── courses/            # Course & lesson management
│   ├── enrollments/        # Student enrollments
│   ├── progress/           # Learning progress tracking
│   ├── payments/           # Payment processing
│   ├── notifications/      # Notifications & messaging
│   ├── dashboard/          # Dashboard analytics
│   ├── attendance/         # Attendance tracking
│   └── myproject/          # Django settings
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # State management
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities & API client
│   │   └── routes/        # Page components
│   └── package.json
│
├── start-dev.bat          # Windows startup script
├── start-dev.sh           # Linux/Mac startup script
├── test-connection.sh     # Connection test script
└── README.md              # This file
```

## 🔧 Development

### Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed database
python manage.py seed

# Start server
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## 🧪 Testing

### Test Backend Connection
```bash
curl http://localhost:8000/api/v1/
```

### Test Frontend Connection
```bash
curl http://localhost:5173/
```

### Run Full Connection Test
```bash
./test-connection.sh
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8000 is available
- Verify Python dependencies: `pip install -r requirements.txt`
- Run migrations: `python manage.py migrate`

### Frontend won't start
- Check if port 5173 is available
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

### CORS errors
- Verify `backend/.env` has: `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- Restart Django server
- Clear browser cache

### Login doesn't work
- Run: `python manage.py seed` to create test users
- Or create superuser: `python manage.py createsuperuser`
- Check browser console for errors

See **[BACKEND_FRONTEND_COMMUNICATION.md](BACKEND_FRONTEND_COMMUNICATION.md)** for detailed troubleshooting.

## 📊 Performance

The application has been optimized to handle large datasets efficiently:

- ✅ **88% reduction** in database queries for student dashboard
- ✅ **98% reduction** in attendance summary queries
- ✅ **67% reduction** in admin dashboard queries
- ✅ Automatic query optimization with `select_related` and `prefetch_related`
- ✅ Bulk operations for notifications

See **[PERFORMANCE_FIX_SUMMARY.md](PERFORMANCE_FIX_SUMMARY.md)** for details.

## 🔒 Security

- JWT-based authentication with automatic token refresh
- CORS protection for cross-origin requests
- Permission-based access control (Admin, Teacher, Student)
- Password hashing with Django's default hasher
- SQL injection protection via Django ORM
- CSRF protection for state-changing operations

## 🚀 Deployment

### Backend (Django)
1. Set `DEBUG=False` in production
2. Use PostgreSQL instead of SQLite
3. Configure proper `SECRET_KEY`
4. Set up Gunicorn + Nginx
5. Use environment variables for sensitive data

### Frontend (React)
1. Build: `npm run build`
2. Serve static files via CDN or Nginx
3. Update API base URL to production endpoint
4. Enable HTTPS

## 📝 API Documentation

API endpoints are documented in **[backend/API_EXAMPLES.md](backend/API_EXAMPLES.md)**

Base URL: `http://localhost:8000/api/v1/`

### Key Endpoints
- `POST /auth/login/` - User login
- `GET /auth/me/` - Get current user
- `GET /dashboard/{role}/` - Role-specific dashboard
- `GET /courses/` - List courses
- `GET /notifications/` - List notifications
- `GET /notifications/messages/` - Inbox

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check documentation in project root
- Review browser console for errors (F12)
- Check terminal output for backend errors
- Run `./test-connection.sh` for diagnostics

## 🎯 Roadmap

- [ ] Video streaming for lessons
- [ ] Real-time chat with WebSockets
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with third-party LMS tools
- [ ] Gamification features (badges, leaderboards)
- [ ] Multi-language support

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Django REST Framework team
- React and Vite communities
- TanStack Router
- Radix UI and shadcn/ui
"# E-learning" 
