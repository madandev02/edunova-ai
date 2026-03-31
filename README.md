# EduNova AI - Adaptive Learning Platform

A production-grade full-stack web application for AI-powered adaptive learning. EduNova enables students to learn at their own pace with personalized recommendations, while instructors manage courses and track student progress through an intuitive dashboard.

Built with production best practices: role-based access control, comprehensive testing, CI/CD automation, and deployment-ready infrastructure.

---

## 🎯 Features

**For Students:**
- Personalized learning dashboard with progress tracking
- Adaptive course recommendations based on skill level
- Interactive lessons with quizzes and real-time feedback
- AI-powered learning assistant for contextual guidance
- Community reviews and discussion forums

**For Instructors:**
- Course creation and lesson authoring workspace
- Student progress analytics and performance insights
- Bulk operations for efficient course management

**For Admins:**
- User management and role administration
- Platform analytics and system configuration

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Vite | Modern UI with type safety |
| **Backend** | FastAPI, SQLAlchemy ORM, Pydantic | REST API with async support |
| **Database** | PostgreSQL (production), SQLite (testing) | Reliable data persistence |
| **Auth** | JWT (python-jose) | Stateless session management |
| **Testing** | pytest, Vitest, Playwright, React Testing Library | Comprehensive test coverage |
| **Infrastructure** | Docker Compose, GitHub Actions | Reproducible environments and CI/CD |

---

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
docker compose up --build -d
```

Access:
- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### Without Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Demo Accounts

All accounts are pre-seeded for immediate testing:

| Role | Email | Password |
|------|-------|----------|
| Student | `student@test.com` | `123456` |
| Instructor | `instructor@test.com` | `123456` |
| Admin | `admin@test.com` | `123456` |

---

## 🧪 Testing & Quality

### Run Tests Locally

**Backend API Tests:**
```bash
python -m pytest backend/tests -q
```
Coverage: authentication, authorization, CRUD operations, edge cases, and security

**Frontend Unit Tests:**
```bash
cd frontend && npm run test:unit
```

**End-to-End Tests:**
```bash
cd frontend && npm run test:e2e
```

### Automated Quality Gates

GitHub Actions CI pipeline validates:
- Lint checks (ESLint, Pylint)
- Build compilation
- Backend pytest suite (18 tests)
- Frontend unit tests (3 tests)
- Docker Compose health checks
- Playwright smoke tests

See `.github/workflows/ci.yml` for full pipeline.

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│         (TypeScript + Vite + React Query)               │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/JWT Bearer Token
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│              (SQLAlchemy ORM + Pydantic)                 │
│                                                          │
│  • Auth & Role-Based Access Control                      │
│  • Course Management & Learning Paths                    │
│  • Progress Analytics & Recommendations                  │
│  • AI Assistant Service                                  │
│  • Reviews & Discussion Forums                           │
└──────────────────────┬──────────────────────────────────┘
                       │ SQLAlchemy
                       ▼
                  PostgreSQL
```

---

## 📖 Environment Configuration

### Backend (`.env`)
```
DATABASE_URL=postgresql://user:password@localhost/edunova
SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000
ADMIN_EMAILS=admin@example.com
DEBUG=false
```

See `backend/.env.example` for complete reference.

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:8000
```

See `frontend/.env.example` for details.

---

## 📁 Project Structure

```
.
├── backend/               # FastAPI REST API
│   ├── app/
│   │   ├── routes/       # HTTP endpoints by domain
│   │   ├── services/     # Business logic
│   │   ├── models/       # SQLAlchemy entities
│   │   ├── schemas/      # Request/response contracts
│   │   └── core/         # Config, security, auth
│   ├── tests/            # pytest suite
│   └── requirements.txt
├── frontend/              # React + TypeScript app
│   ├── src/
│   │   ├── pages/        # Page-level components
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API client integration
│   │   └── router.tsx    # Route definitions
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml    # Full-stack local setup
```

---

## ✨ Engineering Highlights

**Code Quality:**
- Type-safe frontend (TypeScript) and backend (Pydantic)
- Clear separation of concerns (routes → services → models)
- Centralized configuration and environment management

**Testing:**
- 18+ backend API tests covering auth, RBAC, validation, and edge cases
- Frontend unit tests with React Testing Library
- E2E smoke tests with Playwright
- Automated quality gates in CI/CD

**Security:**
- JWT-based stateless authentication
- Role-based access control at route and endpoint levels
- Secure credential handling and CORS configuration
- Protected API endpoints with 401/403 responses

**Deployment Ready:**
- Environment variable templates with secure defaults
- Reproducible Docker Compose setup for development and CI
- Database migration system
- Health check endpoints for monitoring

---

## 🎬 Demo Walkthrough

**Recommended flow for evaluation:**
1. Login with student@test.com
2. Explore dashboard and course catalog
3. Start a lesson and interact with AI assistant
4. Logout and login as instructor@test.com
5. Create a new course or view student analytics

---

## 📚 Additional Resources

- **Backend README:** [backend/README.md](backend/README.md)
- **Frontend README:** [frontend/README.md](frontend/README.md)
- **CI/CD Pipeline:** [.github/workflows/ci.yml](.github/workflows/ci.yml)
- **Engineering Process:** [docs/branch-protection.md](docs/branch-protection.md)

---

## 📝 License

MIT
