import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { GlobalNavbar } from '../components/navigation/GlobalNavbar'
import { useAuth } from '../features/auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'

interface AccessDeniedState {
  from?: string
  allowed?: string[]
}

const getDashboardByRole = (role: string | undefined) => {
  if (role === 'admin') {
    return '/app/admin/dashboard'
  }
  if (role === 'instructor') {
    return '/app/instructor/dashboard'
  }
  return '/app/student/dashboard'
}

export const AccessDeniedPage = () => {
  usePageTitle('Access denied')

  const { user } = useAuth()
  const location = useLocation()
  const state = (location.state as AccessDeniedState | null) ?? null
  const dashboardPath = getDashboardByRole(user?.role)

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', py: { xs: 2, md: 3 } }}>
      <GlobalNavbar compact />
      <Card sx={{ mt: { xs: 2, md: 3 }, borderRadius: 5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.82)' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Stack alignItems="center" spacing={1.2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#fff4ec',
                color: '#b45309',
              }}
            >
              <AlertTriangle size={24} />
            </Box>
            <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'primary.main', fontWeight: 700 }}>
              Access denied
            </Typography>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              This area is restricted for your role
            </Typography>
            <Typography sx={{ maxWidth: 620, color: 'text.secondary' }}>
              You tried to open a protected route{state?.from ? `: ${state.from}` : ''}. Use your dashboard shortcuts to continue with valid actions.
            </Typography>
            {state?.allowed && state.allowed.length ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                Allowed roles: {state.allowed.join(', ')}
              </Typography>
            ) : null}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 3 }}>
            <Button component={Link} to={dashboardPath} variant="contained" fullWidth>
              Go to my dashboard
            </Button>
            <Button component={Link} to="/" variant="outlined" fullWidth>
              Back to home
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}
