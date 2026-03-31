# Backend - EduNova

FastAPI backend for EduNova's adaptive learning platform.

## Responsibilities

- Authentication and token-based session APIs
- Role-aware authorization for student, instructor, and admin flows
- Course catalog and course detail retrieval
- Instructor authoring flows (course/module/lesson creation)
- Learning progression, analytics, recommendations, and assistant context
- Community interactions (reviews and discussions)

## Stack

- FastAPI
- SQLAlchemy ORM
- Pydantic schemas
- PostgreSQL (default runtime database)
- JWT auth (`python-jose` + `passlib`)

## Project Layout

- `app/routes/`: HTTP endpoints grouped by domain
- `app/services/`: business/domain logic
- `app/models/`: SQLAlchemy entities
- `app/schemas/`: request/response contracts
- `app/core/`: config, database, security, migrations, middleware
- `tests/`: pytest-based API and domain tests

## Quick Start

1. Install dependencies:
	- `pip install -r requirements.txt`
2. Run API:
	- `uvicorn main:app --reload --port 8000`
3. Open docs:
	- `http://localhost:8000/docs`

## Environment Variables

Important variables (with defaults in `app/core/config.py`):

- `DATABASE_URL`: SQLAlchemy connection string
- `SECRET_KEY`: JWT signing secret
- `JWT_ALGORITHM`: token algorithm (default `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: token TTL
- `CORS_ORIGINS`: comma-separated allowed frontend origins
- `ADMIN_EMAILS`: comma-separated admin fallback emails
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_PREMIUM`

## Database and Startup Lifecycle

- Tables are created at startup via SQLAlchemy metadata.
- Runtime migrations run from `app/core/migrations.py`.
- Seed initialization runs with idempotent checks.

## Testing

Run all backend tests from repository root:

- `python -m pytest backend/tests -q`

Included coverage areas:

- Auth: register, login success/failure, protected route access
- Health: service availability endpoint
- Courses: instructor create + student list + access control
- Reviews and discussions: creation and validation behavior
- Assistant: response contract and shape

## Design Notes

- Route handlers stay thin; domain behavior lives in services.
- Pydantic schemas define explicit API contracts.
- Role checks exist both as middleware and dependency checks.

## Demo Users

- `student@test.com` / `123456`
- `instructor@test.com` / `123456`
- `admin@test.com` / `123456`
