import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import type { UserRole } from '../../types/api'

interface RoleRouteProps {
  allowed: UserRole[]
}

export const RoleRoute = ({ allowed }: RoleRouteProps) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to="/access-denied" replace state={{ from: location.pathname, allowed }} />
  }

  return <Outlet />
}
