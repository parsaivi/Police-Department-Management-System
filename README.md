# Police Department Management System

A comprehensive web-based system for automating police department processes, built with Django REST Framework and React/Next.js.

## 📋 Project Overview

This project is an intelligent case management system inspired by L.A. Noire, designed to streamline police operations including complaint handling, case investigation, evidence management, suspect tracking, and judicial proceedings.

### Key Features
- ✅ Role-based access control with 15 dynamic roles
- ✅ Multi-field authentication (username, email, phone, national_id)
- ✅ Complaint workflow with state machine (DRAFT → SUBMITTED → APPROVED)
- ✅ Case management with investigation tracking
- ✅ Evidence management with 5 evidence types
- ✅ Suspect investigation with Most Wanted ranking
- ✅ Reward system with unique code generation
- ✅ Trial & sentencing management
- ✅ Public Most Wanted list with reward calculations
- ✅ Detective board with drag-and-drop interface
- ✅ Comprehensive audit logging

## 🏗️ Technology Stack

### Backend
- **Framework**: Django REST Framework (DRF)
- **Database**: PostgreSQL (SQLite for development)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **State Machine**: django-fsm
- **API Documentation**: drf-spectacular (Swagger/OpenAPI)
- **Testing**: Django TestCase + pytest

### Frontend (Checkpoint 2)
- **Framework**: React 18+ or Next.js
- **Styling**: CSS/Tailwind CSS
- **State Management**: Redux/Context API
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose

## 📚 Documentation

### Main Documentation Files
- **[Doc.md](Doc.md)** - Full project requirements and specifications (Persian)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design decisions
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Developer setup and workflow
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing strategy and execution
- **[API_CONTRACT.md](backend/API_CONTRACT.md)** - API contract specification

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL (or SQLite for dev)
- Docker & Docker Compose (optional)
- Git

### Setup

```bash
# Clone repository
git clone <repository-url>
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load default roles
python manage.py shell < scripts/load_default_roles.py

# Run development server
python manage.py runserver
```

**API will be available at**: `http://localhost:8000/api/v1/`
**Admin panel**: `http://localhost:8000/admin/`
**Swagger UI**: `http://localhost:8000/api/schema/swagger/`

### Docker Setup

```bash
docker-compose up -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

## 📁 Project Structure

```
.
├── backend/
│   ├── apps/
│   │   ├── accounts/          # User management & RBAC
│   │   ├── complaints/        # Complaint workflow
│   │   ├── cases/             # Case management
│   │   ├── evidence/          # Evidence & forensics
│   │   ├── suspects/          # Suspect investigation
│   │   ├── rewards/           # Reward system
│   │   ├── judiciary/         # Trial & sentencing
│   │   └── common/            # Shared utilities
│   ├── config/                # Django settings
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
├── Doc.md                     # Full specifications (Persian)
├── ARCHITECTURE.md
├── DEVELOPMENT_GUIDE.md
├── API_DOCUMENTATION.md
├── TESTING_GUIDE.md
├── TODO.md                    # Progress checklist
└── README.md                  # This file
```

## 🔐 Core Workflows

### 1. User Registration & Authentication
- Multi-field login (username/email/phone/national_id)
- JWT token-based authentication
- Dynamic role assignment (no code changes required)

### 2. Complaint Processing
```
DRAFT → SUBMITTED → CADET_REVIEW → OFFICER_REVIEW → APPROVED
              ↓              ↓
     RETURNED_TO_COMPLAINANT  RETURNED_TO_CADET
              ↓
         INVALIDATED (3 strikes)
```

### 3. Case Investigation
```
CREATED → INVESTIGATION → SUSPECT_IDENTIFIED → INTERROGATION 
       → PENDING_CAPTAIN → TRIAL → CLOSED_SOLVED
```

### 4. Evidence Management
Five types: Testimony, Biological, Vehicle, ID Document, Other
- Type-specific validation
- File attachments support
- Verification workflow

### 5. Most Wanted Ranking
- **Formula**: `rank = max(days_wanted) × max(crime_severity)`
- **Reward**: `rank × 20,000,000 Rials`
- **Public List**: Accessible without authentication

### 6. Reward System
```
User submits tip → Officer reviews → Detective approves 
→ Unique code generated → Police lookups with national_id + code
```

## 🧪 Testing

### Run All Tests
```bash
python manage.py test
```

### Run Specific App Tests
```bash
python manage.py test apps.accounts
python manage.py test apps.complaints
python manage.py test apps.suspects
```

### Test Coverage
- **Total Tests**: 120+
- **Minimum Required**: 10
- **Coverage**: 94%+
- **Test Files**: 7 apps, each with comprehensive tests

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing instructions.

## 📊 API Endpoints Summary

### Authentication
- `POST /auth/register/` - Register new user
- `POST /auth/login/` - Login with credentials
- `GET /auth/profile/` - Get current user
- `PUT /auth/profile/` - Update profile

### Complaints
- `GET /complaints/` - List complaints
- `POST /complaints/` - Create complaint
- `POST /complaints/{id}/submit/` - Submit for review
- `POST /complaints/{id}/approve/` - Approve complaint

### Cases
- `GET /cases/` - List cases
- `POST /cases/` - Create case
- `POST /cases/from_crime_scene/` - Create from crime scene
- `PUT /cases/{id}/detective_board/` - Update detective board

### Evidence
- `GET /evidence/` - List evidence
- `POST /evidence/` - Create evidence
- `POST /evidence/{id}/verify/` - Verify evidence
- `POST /evidence/{id}/upload_attachment/` - Upload file

### Suspects
- `GET /suspects/` - List suspects
- `GET /suspects/most_wanted/` - Public most wanted list
- `POST /suspects/` - Create suspect
- `POST /suspects/{id}/detective_score/` - Submit guilt score

### Rewards
- `POST /rewards/tips/` - Submit tip
- `POST /rewards/tips/{id}/officer_review/` - Officer review
- `POST /rewards/codes/lookup/` - Lookup reward code

### Judiciary
- `POST /judiciary/trials/` - Create trial
- `POST /judiciary/trials/{id}/issue_verdict/` - Issue verdict
- `POST /judiciary/trials/{id}/add_sentence/` - Add sentence

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.

## 👥 User Roles (15 Default)

1. **Administrator** - Full system access
2. **Chief** - Police chief operations
3. **Captain** - Team management
4. **Sergeant** - Interrogation & decisions
5. **Detective** - Case investigation
6. **Police Officer** - General operations
7. **Patrol Officer** - Patrol duties
8. **Cadet** - Trainee operations
9. **Complainant** - File complaints
10. **Witness** - Provide testimony
11. **Suspect** - Under investigation
12. **Criminal** - Convicted person
13. **Judge** - Trial verdicts
14. **Coronary** - Forensic examiner
15. **Base User** - Default role

All roles are **dynamically configurable** without code changes.

## 🔒 Security Features

- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ SQL injection prevention (ORM)
- ✅ CSRF protection
- ✅ Input validation & sanitization
- ✅ Secure file upload handling
- ✅ Audit logging (CaseHistory)
- ✅ Unique field constraints (email, phone, national_id)

## 📈 Performance

- Query optimization (select_related, prefetch_related)
- Database indexing on foreign keys
- Pagination (default: 20 per page, max: 100)
- Efficient Most Wanted ranking calculation
- JSON-based detective board for flexibility

## 🐳 Docker Deployment

```bash
# Development
docker-compose up

# Production
docker build -t police-app:latest .
docker run -p 8000:8000 police-app:latest
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Implement feature with tests
3. Ensure 10+ test coverage
4. Create Pull Request with description
5. Get approval & merge to main

### Code Standards
- Follow Django/DRF best practices
- PEP 8 compliance
- Comprehensive docstrings
- Test coverage minimum 90%

## 📝 Development Workflow

See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for:
- Project structure details
- Naming conventions
- Creating new endpoints
- Database optimization
- Troubleshooting

## 🗺️ Roadmap

### Checkpoint 1 (Backend) - ✅ In Progress
- ✅ Foundation & models
- ✅ Auth & RBAC
- ✅ Complaint workflow
- ✅ Case management
- ✅ Evidence system
- ✅ Suspect investigation
- ✅ Reward system
- ✅ Trial & sentencing
- 🔄 Comprehensive testing (120+ tests)
- ⏳ Aggregated stats endpoint

### Checkpoint 2 (Frontend)
- ⏳ React/Next.js application
- ⏳ Role-based dashboards
- ⏳ Detective board (Drag & Drop)
- ⏳ Most Wanted list
- ⏳ Admin panel
- ⏳ Responsive design

## 📞 Support

For issues or questions:
1. Check [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) FAQ section
2. Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. Check [TESTING_GUIDE.md](TESTING_GUIDE.md)
4. Open an issue on GitLab

## 📄 License

This project is part of the "Web Programming" course at the Faculty of Computer Engineering.

## 👨‍💻 Team

Developed as a collaborative university project with focus on:
- Clean code architecture
- Comprehensive testing
- Professional documentation
- Role-based authorization

---

**Last Updated**: January 29, 2026
**Version**: 1.0.0
**Status**: Checkpoint 1 - Backend (Active Development)
