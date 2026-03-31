import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { OnboardingGuard } from './components/auth/OnboardingGuard'
import { RoleRoute } from './components/auth/RoleRoute'
import { AppShell } from './layouts/AppShell'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const module = await import('./pages/LandingPage')
      return { Component: module.LandingPage }
    },
  },
  {
    path: '/login',
    lazy: async () => {
      const module = await import('./pages/LoginPage')
      return { Component: module.LoginPage }
    },
  },
  {
    path: '/register',
    lazy: async () => {
      const module = await import('./pages/RegisterPage')
      return { Component: module.RegisterPage }
    },
  },
  {
    path: '/pricing',
    lazy: async () => {
      const module = await import('./pages/PricingPage')
      return { Component: module.PricingPage }
    },
  },
  {
    path: '/access-denied',
    lazy: async () => {
      const module = await import('./pages/AccessDeniedPage')
      return { Component: module.AccessDeniedPage }
    },
  },
  {
    path: '/onboarding',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await import('./pages/OnboardingPage')
          return { Component: module.OnboardingPage }
        },
      },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <OnboardingGuard />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const module = await import('./pages/RoleDashboardRedirectPage')
                  return { Component: module.RoleDashboardRedirectPage }
                },
              },
              {
                path: 'dashboard',
                lazy: async () => {
                  const module = await import('./pages/RoleDashboardRedirectPage')
                  return { Component: module.RoleDashboardRedirectPage }
                },
              },
              {
                path: 'student/dashboard',
                element: <RoleRoute allowed={['student']} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const module = await import('./pages/DashboardPage')
                      return { Component: module.DashboardPage }
                    },
                  },
                ],
              },
              {
                path: 'instructor/dashboard',
                element: <RoleRoute allowed={['instructor']} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const module = await import('./pages/InstructorDashboardPage')
                      return { Component: module.InstructorDashboardPage }
                    },
                  },
                ],
              },
              {
                path: 'admin/dashboard',
                element: <RoleRoute allowed={['admin']} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const module = await import('./pages/AdminDashboardPage')
                      return { Component: module.AdminDashboardPage }
                    },
                  },
                ],
              },
              {
                path: 'courses',
                lazy: async () => {
                  const module = await import('./pages/CoursesPage')
                  return { Component: module.CoursesPage }
                },
              },
              {
                path: 'instructor/courses',
                element: <RoleRoute allowed={['instructor']} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const module = await import('./pages/InstructorCoursesPage')
                      return { Component: module.InstructorCoursesPage }
                    },
                  },
                ],
              },
              {
                path: 'courses/:courseId',
                lazy: async () => {
                  const module = await import('./pages/CourseDetailPage')
                  return { Component: module.CourseDetailPage }
                },
              },
              {
                path: 'learn/:courseId',
                lazy: async () => {
                  const module = await import('./pages/LearnPage')
                  return { Component: module.LearnPage }
                },
              },
              {
                path: 'learning-path',
                element: <RoleRoute allowed={['student']} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const module = await import('./pages/LearningPathPage')
                      return { Component: module.LearningPathPage }
                    },
                  },
                ],
              },
              {
                path: 'lessons/:lessonId',
                lazy: async () => {
                  const module = await import('./pages/LessonPage')
                  return { Component: module.LessonPage }
                },
              },
              {
                path: 'analytics',
                element: <RoleRoute allowed={['student']} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const module = await import('./pages/AnalyticsPage')
                      return { Component: module.AnalyticsPage }
                    },
                  },
                ],
              },
              {
                path: 'assistant',
                lazy: async () => {
                  const module = await import('./pages/AssistantPage')
                  return { Component: module.AssistantPage }
                },
              },
              {
                path: 'profile',
                lazy: async () => {
                  const module = await import('./pages/ProfilePage')
                  return { Component: module.ProfilePage }
                },
              },
              {
                path: 'content-audit',
                element: <RoleRoute allowed={['admin', 'instructor']} />,
                children: [
                  {
                    index: true,
                    lazy: async () => {
                      const module = await import('./pages/ContentAuditPage')
                      return { Component: module.ContentAuditPage }
                    },
                  },
                ],
              },
              {
                path: 'admin',
                element: <RoleRoute allowed={['admin']} />,
                children: [
                  {
                    path: 'billing-events',
                    lazy: async () => {
                      const module = await import('./pages/AdminBillingEventsPage')
                      return { Component: module.AdminBillingEventsPage }
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: async () => {
      const module = await import('./pages/NotFoundPage')
      return { Component: module.NotFoundPage }
    },
  },
])