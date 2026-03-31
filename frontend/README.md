# Frontend - EduNova

React + TypeScript client for EduNova's learning experience.

## Responsibilities

- Public landing and authentication flows
- Protected app shell with role-aware navigation
- Student learning journey (dashboard, courses, learning workspace)
- Instructor and admin UI surfaces
- API integration for analytics, recommendations, and assistant

## Stack

- React 19 + TypeScript
- Vite
- React Router
- React Query
- Material UI + Tailwind CSS
- Playwright for E2E tests
- Vitest + Testing Library for lightweight unit tests

## Main Routes

- `/`
- `/login`
- `/register`
- `/app/dashboard`
- `/app/courses`
- `/app/courses/:courseId`
- `/app/learn/:courseId`
- `/app/assistant`
- `/app/analytics`
- `/app/learning-path`
- `/app/instructor/*`
- `/app/admin/*`

## Environment Variables

Create `.env` in `frontend/`:

- `VITE_API_BASE_URL=http://localhost:8000`

The frontend API layer also supports fallback behavior for local development.

## Run Locally

1. Install dependencies:
	 - `npm install`
2. Start dev server:
	 - `npm run dev`
3. Production build check:
	 - `npm run build`

## Testing

- Unit tests:
	- `npm run test:unit`
- E2E tests:
	- `npm run test:e2e`
- Visual regression suite:
	- `npm run test:e2e:visual`

## UI Architecture Notes

- Route-level protection is handled in app routing and role guards.
- Shared loading, empty, and error states improve consistency.
- Notification context centralizes app-wide feedback.
- Layout and navigation are responsive for desktop and mobile.

## Suggested Review Points

- Routing and guards in `src/router.tsx`
- Navigation and app shell in `src/components/navigation/`
- Page-level feature composition in `src/pages/`
- API integration layer in `src/services/`
