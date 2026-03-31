import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

const useAuthMock = vi.fn()

vi.mock('../../features/auth/AuthProvider', () => ({
  useAuth: () => useAuthMock(),
}))

describe('Route guards', () => {
  it('redirects unauthenticated users from protected routes to login', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, user: null })

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects users without allowed role to access denied', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, email: 'student@example.com', role: 'student', level: 'BEGINNER', learning_style: 'MIXED' },
    })

    render(
      <MemoryRouter initialEntries={['/app/instructor/dashboard']}>
        <Routes>
          <Route path="/access-denied" element={<div>Access Denied</div>} />
          <Route path="/app/instructor/dashboard" element={<RoleRoute allowed={['instructor']} />}>
            <Route index element={<div>Instructor Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Instructor Dashboard')).not.toBeInTheDocument()
  })
})
