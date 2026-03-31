import { Link } from 'react-router-dom'
import { Button, Card, CardContent, Container, Typography } from '@mui/material'
import { GlobalNavbar } from '../components/navigation/GlobalNavbar'

export const NotFoundPage = () => {
  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', py: 3 }}>
      <GlobalNavbar compact />
      <Card sx={{ mt: 3, borderRadius: 5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.78)' }}>
        <CardContent sx={{ p: 5 }}>
          <Typography sx={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>404</Typography>
          <Typography variant="h4" sx={{ mt: 1.2 }}>Page not found</Typography>
          <Typography sx={{ mx: 'auto', mt: 1.5, maxWidth: 520, color: 'text.secondary' }}>
          This route does not exist in EduNova AI. Return to the landing page and continue from a valid destination.
          </Typography>
          <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>
            Back to landing
          </Button>
        </CardContent>
      </Card>
    </Container>
  )
}
