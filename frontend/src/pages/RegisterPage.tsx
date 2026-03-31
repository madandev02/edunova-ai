import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Container, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../features/auth/AuthProvider'
import { useRegisterMutation } from '../features/auth/mutations'
import { usePageTitle } from '../hooks/usePageTitle'
import { GlobalNavbar } from '../components/navigation/GlobalNavbar'

export const RegisterPage = () => {
  usePageTitle('Sign up')
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const registerMutation = useRegisterMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [level, setLevel] = useState('BEGINNER')
  const [learningStyle, setLearningStyle] = useState('MIXED')
  const trimmedEmail = email.trim()
  const isValidEmail = /\S+@\S+\.\S+/.test(trimmedEmail)
  const isValidPassword = password.length >= 6
  const canSubmit = isValidEmail && isValidPassword

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    registerMutation.mutate(
      {
        email,
        password,
        level,
        learning_style: learningStyle,
      },
      {
        onSuccess: (data) => {
          setSession(data)
          navigate('/onboarding', { replace: true })
        },
      },
    )
  }

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', py: { xs: 2, md: 3 } }}>
      <GlobalNavbar compact />
      <Card className="mesh-hero" sx={{ mt: 3, maxWidth: 560, mx: 'auto', borderRadius: 5, bgcolor: 'rgba(255,255,255,0.78)' }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Create your EduNova account</Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>Start building your personalized AI learning path.</Typography>

          <Box component="form" data-testid="register-form" onSubmit={onSubmit}>
            <Stack spacing={2} sx={{ mt: 3 }}>
              <TextField
                data-testid="register-email"
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
                data-testid="register-password"
                type="password"
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={password.length > 0 && !isValidPassword}
                helperText={password.length > 0 && !isValidPassword ? 'Password must be at least 6 characters.' : ' '}
                required
                inputProps={{ minLength: 6 }}
                fullWidth
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select fullWidth label="Level" value={level} onChange={(event) => setLevel(event.target.value)}>
                    <MenuItem value="BEGINNER">Beginner</MenuItem>
                    <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                    <MenuItem value="ADVANCED">Advanced</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select fullWidth label="Learning style" value={learningStyle} onChange={(event) => setLearningStyle(event.target.value)}>
                    <MenuItem value="MIXED">Mixed</MenuItem>
                    <MenuItem value="VISUAL">Visual</MenuItem>
                    <MenuItem value="PRACTICAL">Practical</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {registerMutation.isError ? <Alert severity="error">{(registerMutation.error as Error).message}</Alert> : null}

              <Button data-testid="register-submit" type="submit" variant="contained" size="large" disabled={registerMutation.isPending || !canSubmit}>
                {registerMutation.isPending ? 'Creating account...' : 'Sign up'}
              </Button>
            </Stack>
          </Box>

          <Typography sx={{ mt: 2.4, textAlign: 'center', color: 'text.secondary' }}>
            Already registered?{' '}
            <Typography component={Link} to="/login" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}>
              Log in
            </Typography>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  )
}
