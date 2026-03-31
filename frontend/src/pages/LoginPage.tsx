import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../features/auth/AuthProvider'
import { useLoginMutation } from '../features/auth/mutations'
import { usePageTitle } from '../hooks/usePageTitle'
import { GlobalNavbar } from '../components/navigation/GlobalNavbar'

export const LoginPage = () => {
  usePageTitle('Login')
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = (location.state as { from?: string } | null)?.from ?? '/app/dashboard'

  const { setSession } = useAuth()
  const loginMutation = useLoginMutation()
  const [email, setEmail] = useState('demo@edunova.ai')
  const [password, setPassword] = useState('Demo1234!')
  const trimmedEmail = email.trim()
  const isValidEmail = /\S+@\S+\.\S+/.test(trimmedEmail)
  const canSubmit = isValidEmail && password.length >= 6

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setSession(data)
          navigate(redirect, { replace: true })
        },
      },
    )
  }

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', py: { xs: 2, md: 3 } }}>
      <GlobalNavbar compact />
      <Card className="mesh-hero" sx={{ mt: 3, maxWidth: 520, mx: 'auto', borderRadius: 5, bgcolor: 'rgba(255,255,255,0.78)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Welcome back</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>Log in to continue your adaptive learning journey.</Typography>

          <Box component="form" data-testid="login-form" onSubmit={onSubmit}>
            <Stack spacing={2} sx={{ mt: 3 }}>
              <TextField
                data-testid="login-email"
                type="email"
                label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={trimmedEmail.length > 0 && !isValidEmail}
                helperText={trimmedEmail.length > 0 && !isValidEmail ? 'Enter a valid email address.' : ' '}
                required
                fullWidth
              />

              <TextField
                data-testid="login-password"
                type="password"
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={password.length > 0 && password.length < 6}
                helperText={password.length > 0 && password.length < 6 ? 'Password must be at least 6 characters.' : ' '}
                required
                fullWidth
              />

              {loginMutation.isError ? <Alert severity="error">{(loginMutation.error as Error).message}</Alert> : null}

              <Button data-testid="login-submit" type="submit" variant="contained" size="large" disabled={loginMutation.isPending || !canSubmit}>
                {loginMutation.isPending ? 'Signing in...' : 'Log in'}
              </Button>
            </Stack>
          </Box>

          <Typography sx={{ mt: 2.4, textAlign: 'center', color: 'text.secondary' }}>
            No account yet?{' '}
            <Typography component={Link} to="/register" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}>
              Create one
            </Typography>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  )
}
