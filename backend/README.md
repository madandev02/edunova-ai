# Backend - EduNova AI

FastAPI REST API for the EduNova adaptive learning platform.

---

## Overview

The backend provides a complete REST API for managing adaptive learning flows: student authentication, course management, progress tracking, intelligent recommendations, and AI-powered learning assistance.

**Key APIs:**
- Authentication (register, login, JWT token refresh)
- Course catalog and course details
- Instructor course creation and lesson authoring
- Student learning session tracking and progress
- AI assistant for contextual learning guidance
- Course reviews and discussion forums
- Analytics and recommendation engine

---

## Tech Stack

- **Framework:** FastAPI (async Python web framework)
- **ORM:** SQLAlchemy with async support
- **Database:** PostgreSQL (production), SQLite (testing)
- **Auth:** JWT (python-jose, passlib)
- **Validation:** Pydantic v2
- **Testing:** pytest with pytest-cov
- **HTTP Client:** httpx (testing)

---

## Project Structure

```
backend/
├── app/
│   ├── routes/              # HTTP endpoints by domain
│   │   ├── auth.py         # Auth endpoints
│   │   ├── courses.py      # Course management
│   │   ├── lessons.py      # Lesson retrieval
│   │   ├── assistant.py    # AI assistant
│   │   ├── progress.py     # Progress tracking
│   │   ├── analytics.py    # User analytics
│   │   ├── recommendations.py
│   │   └── ...
│   ├── services/            # Business logic layer
│   │   ├── auth_service.py
│   │   ├── course_service.py
│   │   ├── assistant_service.py
│   │   ├── recommender_engine.py
│   │   └── ...
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── lesson_session.py
│   │   ├── progress.py
│   │   └── ...
│   ├── schemas/             # Request/response contracts
│   │   ├── auth.py
│   │   ├── course.py
│   │   └── ...
│   └── core/                # Configuration & infrastructure
│       ├── config.py        # Settings, environment variables
│       ├── database.py      # DB session and connection
│       ├── security.py      # JWT and auth utilities
│       └── migrations.py    # Database setup
├── tests/
│   ├── conftest.py          # pytest fixtures
│   ├── test_auth.py         # Auth flow tests
│   ├── test_courses.py      # Course CRUD tests
│   ├── test_assistant.py    # Assistant response tests
│   └── ...
├── main.py                  # App initialization
├── requirements.txt         # Dependencies
└── pytest.ini              # pytest configuration
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL (or SQLite for testing)

### Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run migrations & seed data:**
   ```bash
   python -m app.core.migrations
   ```

4. **Start API server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

   Server will be available at `http://localhost:8000`

5. **View API documentation:**
   - Interactive Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

## 🔐 Demo Accounts

Pre-seeded on startup:

| Email | Password | Role |
|-------|----------|------|
| `student@test.com` | `123456` | Student |
| `instructor@test.com` | `123456` | Instructor |
| `admin@test.com` | `123456` | Admin |

---

## Environment Variables

Key configuration (see `backend/.env.example` for full list):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `sqlite:///./test.db` | SQLAlchemy connection string |
| `SECRET_KEY` | *required* | JWT signing secret (change for production) |
| `JWT_ALGORITHM` | `HS256` | Token signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token TTL |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed frontend origins |
| `ADMIN_EMAILS` | `admin@test.com` | Admin fallback accounts |
| `DEBUG` | `false` | Debug mode (false for production) |

---

## 🧪 Testing

### Run All Tests
```bash
python -m pytest backend/tests -q
```

### Run with Coverage
```bash
python -m pytest backend/tests --cov=app --cov-report=html
```

### Test Files & Coverage

| Test File | Coverage |
|-----------|----------|
| `test_auth.py` | Registration, login, protected routes, wrong credentials |
| `test_health.py` | Service availability health endpoint |
| `test_courses.py` | Course creation (instructor), listing (student), access control |
| `test_reviews_discussions.py` | Review/discussion creation, validation, rating constraints |
| `test_assistant.py` | Assistant response contract and availability |
| `test_security_and_edges.py` | Auth errors (401), RBAC (403), validation (422), not found (404) |
| `test_onboarding_engine.py` | Onboarding profile creation and skill tracking |

**Test Infrastructure:**
- pytest fixtures for user creation and auth
- SQLite in-memory database for test isolation
- Mock test client with dependency overrides
- Admin/student user factory helpers

---

## API Routes Overview

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Get JWT token + refresh token
- `POST /auth/refresh` - Refresh expired token

### Courses
- `GET /courses` - List courses (with filters)
- `GET /courses/{id}` - Course details with modules/lessons
- `POST /courses` - Create course (instructor only)
- `PATCH /courses/{id}` - Update course (owner only)

### Learning
- `GET /learn/{courseId}` - Get lesson content
- `POST /learning-sessions` - Start/track session
- `POST /progress` - Record progress event

### Assistant
- `POST /assistant/ask` - Get AI guidance on topic

### Analytics
- `GET /analytics/dashboard` - User dashboard metrics
- `GET /analytics/weak-areas` - Skill gaps analysis

### Admin
- `GET /admin/users` - List all users
- `PATCH /admin/users/{id}/role` - Change user role

---

## Architecture Patterns

### Dependency Injection
Routes accept service dependencies through FastAPI's `Depends()`:
```python
@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends()
):
    return current_user.to_dict()
```

### Role-Based Access Control
Routes use `@require_role()` decorator for RBAC:
```python
@router.post("/courses")
@require_role(["instructor", "admin"])
async def create_course(course: CourseCreate, current_user: User = Depends(...)):
    ...
```

### Service Layer
Business logic is isolated in service classes:
- Auth service: password hashing, token generation
- Course service: CRUD operations with validation
- Recommender engine: skill-based recommendation algorithm
- Assistant service: LLM integration and context building

### Database
- SQLAlchemy ORM for type-safe queries
- Async session management with connection pooling
- Migration support via `app/core/migrations.py`

---

## Health Checks

**Service Health Endpoint:**
```bash
curl http://localhost:8000/health
```

Returns:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-03-31T10:30:00Z"
}
```

---

## Deployment

### Docker
```bash
docker compose up --build -d
```

### Env-Based Configuration
Update `.env` with production values:
```
DEBUG=false
DATABASE_URL=postgresql://prod_user:password@prod-db.example.com/edunova
SECRET_KEY=your-production-secret-key
CORS_ORIGINS=https://your-frontend-domain.com
ADMIN_EMAILS=admin@your-domain.com
```

### Database Migration (Production)
```bash
python -m app.core.migrations
```

---

## Key Design Decisions

**Async/Await:** All route handlers and services use async for high concurrency.

**Pydantic Schemas:** Explicit request/response validation ensures API contract clarity.

**Role-Based Authorization:** Checked at route level with `@require_role()` decorator.

**Service Layer:** Routes delegate to services; services own business logic.

**Test Isolation:** SQLite in-memory database for fast, isolated test execution.

---

## Common Tasks

**Create a new API endpoint:**
1. Add route handler in `app/routes/domain.py`
2. Add Pydantic schema in `app/schemas/domain.py`
3. Add business logic in `app/services/domain_service.py`
4. Add tests in `tests/test_domain.py`

**Add database migration:**
Edit `app/core/migrations.py` to add your schema changes. Runs automatically at app startup.

**Run tests locally:**
```bash
cd backend && python -m pytest tests -q
```

---

## Troubleshooting

**Port already in use:**
```bash
uvicorn main:app --reload --port 8001
```

**Database connection failed:**
Verify `DATABASE_URL` in `.env` and database is running.

**Tests failing:**
Ensure `pytest.ini` configuration is present and run from repository root:
```bash
python -m pytest backend/tests -q
```

---

## Support

See parent repository [README.md](../README.md) for full project context and demo account setup.
