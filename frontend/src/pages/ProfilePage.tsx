import { ShieldCheck, Sparkles, UserCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { useAuth } from '../features/auth/AuthProvider'
import { useOnboardingStatusQuery } from '../features/auth/queries'
import { useDashboardQuery } from '../features/dashboard/queries'
import { usePageTitle } from '../hooks/usePageTitle'
import { isAdminUser } from '../lib/admin'
import { apiService } from '../services/api'

export const ProfilePage = () => {
  usePageTitle('Profile')

  const { user } = useAuth()
  const isAdmin = isAdminUser(user)
  const canViewContentAudit = user?.role === 'admin' || user?.role === 'instructor'
  const dashboardQuery = useDashboardQuery()
  const onboardingQuery = useOnboardingStatusQuery(true)
  const contentAuditQuery = useQuery({
    queryKey: ['content-audit'],
    queryFn: apiService.getContentAudit,
    enabled: canViewContentAudit,
  })
  const subscriptionQuery = useQuery({
    queryKey: ['subscription-status'],
    queryFn: apiService.getSubscriptionStatus,
  })
  const webhookEventsQuery = useQuery({
    queryKey: ['billing-webhook-events'],
    queryFn: () => apiService.getWebhookEvents({ limit: 8 }),
    enabled: isAdmin,
  })

  const currentPlan = subscriptionQuery.data?.plan ?? 'free'
  const hasPremiumEntitlement = Boolean(subscriptionQuery.data?.isActive)

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper
        sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}
      >
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Account
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Your learning profile and system health snapshot</Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>
          Profile, onboarding status, learning momentum, and content quality telemetry in one view.
        </Typography>
      </Paper>

      <Grid container spacing={{ xs: 1.2, md: 2 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                <UserCircle2 size={14} /> Learner profile
              </Typography>
              <Typography variant="h6" sx={{ mt: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{user?.email ?? 'Unknown user'}</Typography>
              <Typography sx={{ mt: 0.8, color: 'text.secondary' }}>Level: {user?.level ?? 'BEGINNER'}</Typography>
              <Typography sx={{ mt: 0.4, color: 'text.secondary' }}>Learning style: {user?.learning_style ?? 'MIXED'}</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.3 }}>
                <Chip
                  size="small"
                  label={`Plan: ${String(currentPlan).toUpperCase()}`}
                  sx={{ bgcolor: hasPremiumEntitlement ? '#edf8f0' : '#f6f6f6', color: hasPremiumEntitlement ? '#1f7749' : '#58677a' }}
                />
                <Chip
                  size="small"
                  label={hasPremiumEntitlement ? 'Premium entitlement active' : 'Premium entitlement inactive'}
                  sx={{ bgcolor: hasPremiumEntitlement ? '#e8f2ff' : '#fff4ec', color: hasPremiumEntitlement ? '#0d4f86' : '#9e5b31' }}
                />
              </Stack>

              <Box sx={{ mt: 1.2 }}>
                <Button component={Link} to="/pricing" size="small" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
                  Manage plan and billing
                </Button>
              </Box>

              <Paper variant="outlined" sx={{ mt: 2, borderRadius: 3, p: 1.4, bgcolor: '#fffdfa' }}>
                <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                  Onboarding
                </Typography>
                <Typography sx={{ mt: 0.8, color: 'text.secondary' }}>
                  {onboardingQuery.data?.completed
                    ? `Completed at level ${onboardingQuery.data.level ?? 'N/A'}`
                    : 'Not completed yet'}
                </Typography>
                {onboardingQuery.data?.first_course_id ? (
                  <Typography sx={{ mt: 0.4, fontSize: 13, color: 'text.secondary' }}>
                    Initial course id: {onboardingQuery.data.first_course_id}
                  </Typography>
                ) : null}
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                <Sparkles size={14} /> Learning momentum
              </Typography>
              <Typography sx={{ mt: 1.4, color: 'text.secondary' }}>XP: {dashboardQuery.data?.gamification.xp ?? 0}</Typography>
              <Typography sx={{ mt: 0.4, color: 'text.secondary' }}>Streak days: {dashboardQuery.data?.gamification.streakDays ?? 0}</Typography>
              <Typography sx={{ mt: 0.4, color: 'text.secondary' }}>Progress: {dashboardQuery.data?.progress.percentage ?? 0}%</Typography>
              <Typography sx={{ mt: 0.4, color: 'text.secondary' }}>Recommendations: {dashboardQuery.data?.recommendations.length ?? 0}</Typography>

              <Paper variant="outlined" sx={{ mt: 2, borderRadius: 3, p: 1.4, bgcolor: '#f8fbff' }}>
                <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                  Achievements
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.1 }}>
                  {(dashboardQuery.data?.gamification.achievements ?? []).length === 0 ? (
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                      No badges yet. Keep learning to unlock milestones.
                    </Typography>
                  ) : (
                    (dashboardQuery.data?.gamification.achievements ?? []).map((badge) => (
                      <Chip key={badge} label={badge} sx={{ bgcolor: '#ecf9ef', color: '#1f7749' }} size="small" />
                    ))
                  )}
                </Stack>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, xl: 4 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                <ShieldCheck size={14} /> Content integrity
              </Typography>
              {!canViewContentAudit ? (
                <Typography sx={{ mt: 1.3, color: 'text.secondary' }}>
                  Detailed content integrity telemetry is available for instructor and admin roles.
                </Typography>
              ) : null}
              {canViewContentAudit && contentAuditQuery.isPending ? <Typography sx={{ mt: 1.3, color: 'text.secondary' }}>Loading audit summary...</Typography> : null}
              {canViewContentAudit && contentAuditQuery.isError ? <Typography sx={{ mt: 1.3, color: 'error.main' }}>Unable to load content audit.</Typography> : null}

              {canViewContentAudit && contentAuditQuery.data ? (
                <>
                  <Typography sx={{ mt: 1.3, fontWeight: 700, color: contentAuditQuery.data.healthy ? 'success.main' : 'warning.dark' }}>
                    {contentAuditQuery.data.healthy ? 'Healthy: no alignment mismatches detected' : 'Attention: alignment issues detected'}
                  </Typography>
                  <Stack spacing={0.4} sx={{ mt: 1 }}>
                    <Typography sx={{ color: 'text.secondary' }}>Courses: {contentAuditQuery.data.summary.courses}</Typography>
                    <Typography sx={{ color: 'text.secondary' }}>Modules: {contentAuditQuery.data.summary.modules}</Typography>
                    <Typography sx={{ color: 'text.secondary' }}>Lessons: {contentAuditQuery.data.summary.lessons}</Typography>
                    <Typography sx={{ color: 'text.secondary' }}>Video mismatches: {contentAuditQuery.data.summary.video_mismatch}</Typography>
                    <Typography sx={{ color: 'text.secondary' }}>Quiz mismatches: {contentAuditQuery.data.summary.quiz_mismatch}</Typography>
                    <Typography sx={{ color: 'text.secondary' }}>Structure mismatches: {contentAuditQuery.data.summary.structure_mismatch}</Typography>
                  </Stack>
                  <Box sx={{ mt: 1.6 }}>
                    <Button component={Link} to="/app/content-audit" size="small" variant="outlined">
                      Open detailed audit view
                    </Button>
                  </Box>
                </>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        {isAdmin ? (
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                Billing lifecycle debug
              </Typography>
              <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: 14 }}>
                Recent Stripe webhook events persisted by backend for subscription troubleshooting.
              </Typography>

              {webhookEventsQuery.isPending ? <Typography sx={{ mt: 1.3, color: 'text.secondary' }}>Loading webhook events...</Typography> : null}
              {webhookEventsQuery.isError ? <Typography sx={{ mt: 1.3, color: 'error.main' }}>Unable to load webhook events.</Typography> : null}

              {webhookEventsQuery.data ? (
                <Stack spacing={1} sx={{ mt: 1.6 }}>
                  {webhookEventsQuery.data.items.length === 0 ? (
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                      No webhook events received yet.
                    </Typography>
                  ) : (
                    webhookEventsQuery.data.items.map((event) => (
                      <Paper key={event.id} variant="outlined" sx={{ borderRadius: 3, p: 1.3, bgcolor: '#fffdfa' }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between">
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{event.eventType}</Typography>
                          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                            <Chip size="small" label={event.status} sx={{ bgcolor: event.status === 'processed' ? '#ecf9ef' : event.status === 'failed' ? '#fff1ef' : '#f6f6f6', color: event.status === 'processed' ? '#1f7749' : event.status === 'failed' ? '#b42318' : '#58677a' }} />
                            <Chip size="small" label={new Date(event.createdAt).toLocaleString()} variant="outlined" />
                          </Stack>
                        </Stack>
                        {event.stripeEventId ? (
                          <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>Stripe event: {event.stripeEventId}</Typography>
                        ) : null}
                        {event.errorMessage ? (
                          <Typography sx={{ mt: 0.5, fontSize: 12, color: 'error.main' }}>Error: {event.errorMessage}</Typography>
                        ) : null}
                      </Paper>
                    ))
                  )}
                </Stack>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
        ) : null}
      </Grid>
    </Stack>
  )
}
