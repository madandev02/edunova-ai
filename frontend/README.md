# Frontend - EduNova AI

React 19 + TypeScript web application for EduNova's adaptive learning platform.

---

## Overview

The frontend provides an intuitive, responsive user interface for the EduNova learning management system. It supports three distinct workflows:

- **Student:** Dashboard, course discovery, interactive lessons, progress tracking, AI assistant
- **Instructor:** Course creation, lesson authoring, student analytics
- **Admin:** User management, platform configuration

The app features role-based routing, global notification system, and comprehensive test coverage.

---

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Data Fetching:** React Query
- **UI Components:** Material UI + Tailwind CSS
- **Testing:** Vitest, React Testing Library, Playwright
- **Package Manager:** npm

---

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx                  # Root app component
│   ├── main.tsx                 # Entry point
│   ├── router.tsx               # Route definitions & guards
│   ├── vite-env.d.ts            # Vite type definitions
│   ├── pages/                   # Page-level components
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── public/
│   │   │   └── LandingPage.tsx
│   │   ├── student/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CourseCatalogPage.tsx
│   │   │   └── LearningPage.tsx
│   │   ├── instructor/
│   │   │   ├── CourseEditorPage.tsx
│   │   │   └── AnalyticsPage.tsx
│   │   └── admin/
│   │       └── UserManagementPage.tsx
│   ├── components/              # Reusable UI components
│   │   ├── auth/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── RoleRoute.tsx
│   │   │   └── RouteGuards.test.tsx
│   │   ├── navigation/
│   │   │   ├── Navbar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── states/
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   └── ErrorState.tsx
│   │   └── ...
│   ├── services/                # API client integration
│   │   ├── api.ts               # Base API client
│   │   ├── auth.ts
│   │   ├── courses.ts
│   │   └── ...
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   ├── types/                   # TypeScript types
│   ├── context/                 # React Context (global state)
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── styles/                  # Global styles
│   ├── theme/                   # Theme configuration
│   └── test/
│       └── setup.ts             # Test environment setup
├── e2e/                         # Playwright E2E tests
├── public/                      # Static assets
├── package.json
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript config
├── tailwind.config.js           # Tailwind CSS config
└── playwright.config.ts         # Playwright config
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Default: VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Access at `http://localhost:5173` (or port shown in terminal)

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔐 Demo Accounts

| Email | Password | Role | Recommended Flow |
|-------|----------|------|------------------|
| `student@test.com` | `123456` | Student | Dashboard → Courses → Learn → Assistant |
| `instructor@test.com` | `123456` | Instructor | Dashboard → Create Course → View Analytics |
| `admin@test.com` | `123456` | Admin | User Management → Settings |

---

## Environment Variables

Create `.env` file in `frontend/`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Optional: disable HTTPS requirement in dev
# VITE_API_SECURE=false
```

For Docker deployments:
```bash
VITE_API_BASE_URL=https://your-backend-api-domain.com
```

---

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

Tests are located in `src/**/*.test.tsx`. Uses Vitest + React Testing Library.

**Current test coverage:**
- `EmptyState.test.tsx` - Component render validation
- `RouteGuards.test.tsx` - Auth/RBAC redirect behavior
- Custom hooks and utilities

**Run with coverage:**
```bash
npm run test:unit -- --coverage
```

### End-to-End Tests
```bash
npm run test:e2e
```

Playwright tests in `e2e/` folder validate full user workflows:
- `smoke.spec.ts` - Critical path smoke tests
- `visual.spec.ts` - Visual regression tests

**Run specific test:**
```bash
npm run test:e2e -- smoke.spec.ts
```

### Linting
```bash
npm run lint
```

Validates TypeScript, JSX, and code style with ESLint.

---

## Routes & Page Structure

### Public Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `LandingPage` | Marketing landing page |
| `/login` | `LoginPage` | User authentication |
| `/register` | `RegisterPage` | Account creation |

### Protected Routes (Require Auth)
| Route | Role(s) | Component | Purpose |
|-------|---------|-----------|---------|
| `/app/dashboard` | student, instructor, admin | `DashboardPage` | User dashboard |
| `/app/courses` | all | `CourseCatalogPage` | Browse courses |
| `/app/learn/:courseId` | student | `LearningPage` | Interactive lesson |
| `/app/instructor/*` | instructor, admin | `InstructorPages` | Course authoring |
| `/app/admin/*` | admin | `AdminPages` | User management |

### Route Guards
- `ProtectedRoute` - Requires authentication (redirects to login if not logged in)
- `RoleRoute` - Requires specific role(s) (shows access denied if unauthorized)

See `src/components/auth/RouteGuards.tsx` for implementation.

---

## API Integration

### Base API Client (`src/services/api.ts`)

```typescript
import { apiClient } from '@/services/api';

// GET request
const courses = await apiClient.get('/courses');

// POST with auth
const response = await apiClient.post('/courses', coursePayload);

// Automatic JWT handling
// Error handling for 401/403 responses
```

### Services by Domain
- `auth.ts` - Login, register, token refresh
- `courses.ts` - Course CRUD and retrieval
- `learning.ts` - Lesson content and sessions
- `assistant.ts` - AI assistant queries
- `progress.ts` - User progress tracking
- `analytics.ts` - Dashboard metrics

---

## State Management

### React Query
Used for server state management (caching, synchronization):
```typescript
const { data: courses } = useQuery({
  queryKey: ['courses'],
  queryFn: () => apiClient.get('/courses')
});
```

### React Context
Global client state (auth, notifications):
- `AuthContext` - Current user, login state
- `NotificationContext` - Toast notifications

---

## Key Components

### Navbar
- Responsive navigation with role-aware menu items
- Logout functionality
- Mobile drawer on small screens

### Loading & Empty States
- Centralized `LoadingState`, `EmptyState`, `ErrorState` components
- Consistent UX across all pages

### Notifications
```typescript
const { notify } = useNotification();
notify('Course created!', 'success');
```

Global notification system for feedback.

---

## Styling

### Tailwind CSS
Utility-first CSS framework for responsive, consistent styling.

### Material UI Components
Pre-built components for forms, buttons, dialogs, etc.

### Theme Configuration
Centralized theme settings in `src/theme/` for consistent design.

---

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive components
- Keyboard navigation support
- Color contrast compliance

---

## Performance

- Code splitting via React Router lazy loading
- Image optimization
- Efficient re-renders with React Query caching
- Production build optimization

---

## Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Make changes & test:**
   ```bash
   npm run lint
   npm run test:unit
   npm run test:e2e
   ```

4. **Build & verify:**
   ```bash
   npm run build
   npm run preview
   ```

5. **Commit & push:**
   ```bash
   git add . && git commit -m "feat: my feature"
   git push origin feature/my-feature
   ```

---

## Deployment

### Environment Setup
Update `.env` for your deployment environment:
```bash
VITE_API_BASE_URL=https://your-api-domain.com
```

### Build
```bash
npm run build
```

Outputs optimized production bundle to `dist/` folder.

### Deploy Options
- **Vercel:** Connect GitHub repo, Vercel auto-deploys
- **Netlify:** Drag & drop `dist/` folder or connect GitHub
- **AWS S3 + CloudFront:** Upload `dist/` to S3, configure CDN
- **Docker:** Use `frontend/Dockerfile` from root `docker-compose.yml`

---

## Common Issues

**Port 5173 already in use:**
```bash
npm run dev -- --port 5174
```

**API requests failing (CORS error):**
- Verify `VITE_API_BASE_URL` matches backend URL
- Check backend CORS_ORIGINS includes frontend URL

**Tests failing:**
```bash
npm run lint
npm run test:unit -- --reporter=verbose
```

**Production build large:**
Run `npm run build` and check bundle analysis output.

---

## Support

See parent repository [README.md](../README.md) for full project context.

Backend README: [Backend Setup & API Docs](../backend/README.md)
