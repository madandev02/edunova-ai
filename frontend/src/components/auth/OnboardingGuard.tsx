import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { useOnboardingStatusQuery } from '../../features/auth/queries'
import { LoadingState } from '../states/LoadingState'

export const OnboardingGuard = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const statusQuery = useOnboardingStatusQuery(isAuthenticated)

  if (statusQuery.isPending) {
    return <LoadingState label="Preparing your personalized workspace..." />
  }

  if (statusQuery.data && !statusQuery.data.completed) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
