import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

export const RoleDashboardRedirectPage = () => {
  const { user } = useAuth()

  if (user?.role === 'admin') {
    return <Navigate to="/app/admin/dashboard" replace />
  }

  if (user?.role === 'instructor') {
    return <Navigate to="/app/instructor/dashboard" replace />
  }

  return <Navigate to="/app/student/dashboard" replace />
}
