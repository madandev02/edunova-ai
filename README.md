# EduNova AI

EduNova AI is a real full-stack product for adaptive learning, built to demonstrate production-minded engineering: role-based architecture, automated quality gates, and deployment-ready configuration.

It is intentionally portfolio-optimized to communicate one message clearly:

I can build real systems, not just features.

## 🚀 Live Demo

- Frontend URL: https://your-frontend-domain.com
- Backend API URL: https://your-backend-api-domain.com

## Product Highlights

- JWT-based authentication and protected application routes
- Role-based access for student, instructor, and admin workflows
- Course marketplace, learning workspace, and progress tracking
- Reviews, discussions, analytics, recommendations, and AI assistant guidance
- Dockerized full-stack local and CI execution

## Architecture

```text
[React Frontend]
      |
      | HTTPS + JWT Bearer Token
      v
[FastAPI Backend]
      |
      | SQLAlchemy ORM
      v
[PostgreSQL Database]

Cross-cutting concerns:
- JWT authentication for protected APIs
- Role-based access control (student/instructor/admin)
- AI assistant service for contextual learning guidance
```

## Repository Structure

- `frontend/` React + TypeScript + Vite app
- `backend/` FastAPI + SQLAlchemy services and APIs
- `docs/` engineering process documentation

## Demo Accounts

- student@test.com / 123456
- instructor@test.com / 123456
- admin@test.com / 123456

These accounts are seeded by the backend startup seed routine for reliable demos.

## 🎥 Demo Video

- Watch 90-second walkthrough: [link]

Recommended walkthrough sequence:

- Login flow
- Student dashboard and learning progress
- Instructor creating a course
- AI assistant response in context

## Local Development

### Docker

1. Start stack:
  - `docker compose up --build -d`
2. Open:
  - Frontend: `http://localhost:3000`
  - Backend docs: `http://localhost:8000/docs`
  - Health: `http://localhost:8000/health`

### Without Docker

1. Backend:
  - `cd backend`
  - `pip install -r requirements.txt`
  - `uvicorn main:app --reload --port 8000`
2. Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev`

## Environment Setup

- Backend example: `backend/.env.example`
- Frontend example: `frontend/.env.example`

Use these files as templates before deployment.

## 🧪 Engineering Quality

- Backend tests with pytest (`backend/tests/`)
- Frontend unit tests with Vitest + Testing Library
- Frontend E2E and visual smoke tests with Playwright
- CI pipeline in `.github/workflows/ci.yml` running lint, build, tests, and smoke checks
- Docker Compose-based reproducible local and CI environments

## Recruiter Review Guide

- API routes: `backend/app/routes/`
- Domain logic: `backend/app/services/`
- Auth and role guards: `frontend/src/components/auth/`
- Integration layer: `frontend/src/services/`
- Test suites: `backend/tests/` and `frontend/src/**/*.test.tsx`

## Additional Notes

- Branch protection checklist: `docs/branch-protection.md`
- Backend and frontend READMEs include stack-specific operational details
