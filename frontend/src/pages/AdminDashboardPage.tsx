import { CreditCard, ShieldCheck, Wrench } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Alert, Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { usePageTitle } from '../hooks/usePageTitle'
import { apiService } from '../services/api'

export const AdminDashboardPage = () => {
  usePageTitle('Admin Dashboard')

  const webhookEventsQuery = useQuery({
    queryKey: ['admin-dashboard-webhooks'],
    queryFn: () => apiService.getWebhookEvents({ limit: 5 }),
  })

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}>
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Admin command center
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Operations, billing, and platform control
        </Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>
          Role-protected dashboard for operational visibility.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
          <Button component={Link} to="/app/admin/billing-events" variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Open billing events
          </Button>
          <Button component={Link} to="/app/content-audit" variant="outlined" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Open content audit
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={{ xs: 1.2, md: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                <CreditCard size={14} /> Billing ops
              </Typography>
              <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                Latest webhook events are shown below. Full controls are available in the billing events page.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                <ShieldCheck size={14} /> Access control
              </Typography>
              <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                RBAC checks now use user role with legacy admin-email fallback during migration.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                <Wrench size={14} /> Platform controls
              </Typography>
              <Typography sx={{ mt: 1, color: 'text.secondary' }}>
                Next iteration adds payload inspection modal, JSON copy, and safer retry diagnostics.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {webhookEventsQuery.isPending ? <Alert severity="info">Loading latest webhook events...</Alert> : null}
      {webhookEventsQuery.isError ? <Alert severity="error">Unable to load webhook events.</Alert> : null}

      {(webhookEventsQuery.data?.items ?? []).map((item) => (
        <Paper key={item.id} variant="outlined" sx={{ borderRadius: 3, p: 1.5, bgcolor: '#fffdfa' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{item.eventType}</Typography>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              <Chip size="small" label={item.status} />
              <Chip size="small" label={new Date(item.createdAt).toLocaleString()} variant="outlined" />
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}
