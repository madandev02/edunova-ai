import { CheckCircle2, Crown, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Chip, Grid, Paper, Snackbar, Stack, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { GlobalNavbar } from '../components/navigation/GlobalNavbar'
import { useAuth } from '../features/auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { apiService } from '../services/api'

type PlanId = 'free' | 'pro' | 'premium'

const plans: Array<{
  id: PlanId
  title: string
  monthly: string
  subtitle: string
  badge?: string
  features: string[]
}> = [
  {
    id: 'free',
    title: 'Free',
    monthly: '$0',
    subtitle: 'For exploration and onboarding',
    features: ['Public catalog access', 'Basic dashboard metrics', 'Core learning path'],
  },
  {
    id: 'pro',
    title: 'Pro',
    monthly: '$19',
    subtitle: 'For serious individual learners',
    badge: 'Most popular',
    features: ['Premium courses unlocked', 'Advanced analytics', 'Priority recommendation refresh'],
  },
  {
    id: 'premium',
    title: 'Premium',
    monthly: '$39',
    subtitle: 'For high-performance learners',
    badge: 'Best value',
    features: ['Everything in Pro', 'Deeper AI personalization', 'Early access to new tracks'],
  },
]

export const PricingPage = () => {
  usePageTitle('Pricing')
  const { isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const [toast, setToast] = useState<{ open: boolean; severity: 'success' | 'info' | 'error'; message: string }>({
    open: false,
    severity: 'info',
    message: '',
  })

  const checkoutSignal = searchParams.get('checkout')

  const subscriptionQuery = useQuery({
    queryKey: ['subscription-status'],
    queryFn: apiService.getSubscriptionStatus,
    enabled: isAuthenticated,
  })

  const customerPortalMutation = useMutation({
    mutationFn: apiService.createCustomerPortalSession,
    onSuccess: (data) => {
      window.location.href = data.portalUrl
    },
    onError: (error) => {
      setToast({ open: true, severity: 'error', message: error.message })
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: (plan: 'pro' | 'premium') => apiService.createCheckoutSession(plan),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl
    },
    onError: (error) => {
      setToast({ open: true, severity: 'error', message: error.message })
    },
  })

  const currentPlan = subscriptionQuery.data?.plan ?? 'free'

  const checkoutBanner = useMemo(() => {
    if (checkoutSignal === 'success') {
      return { severity: 'success' as const, message: 'Payment confirmed. Your subscription is now active.' }
    }
    if (checkoutSignal === 'cancelled') {
      return { severity: 'info' as const, message: 'Checkout cancelled. You can resume anytime.' }
    }
    return null
  }, [checkoutSignal])

  return (
    <Box sx={{ minHeight: '100vh', width: '100%', px: { xs: 1.6, sm: 2, md: 3, lg: 4 }, py: { xs: 1.6, md: 2.5 } }}>
      <Box sx={{ maxWidth: '1520px', mx: 'auto' }}>
        <GlobalNavbar compact />

        <Box sx={{ maxWidth: '1360px', mx: 'auto', mt: { xs: 2, md: 3 } }}>
          {checkoutBanner ? (
            <Alert severity={checkoutBanner.severity} sx={{ mb: 2.5, borderRadius: 3 }}>
              {checkoutBanner.message}
            </Alert>
          ) : null}

          <Paper sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3.2 }, bgcolor: 'rgba(255,255,255,0.78)' }}>
            <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'primary.main', fontWeight: 700 }}>
              Billing
            </Typography>
            <Typography variant="h3" sx={{ mt: 1.2, fontSize: { xs: '1.6rem', sm: '2rem', md: '2.8rem' } }}>
              Pick the plan that matches your growth pace
            </Typography>
            <Typography sx={{ mt: 1.2, color: 'text.secondary', maxWidth: 760, fontSize: { xs: '0.92rem', sm: '1rem' } }}>
              Upgrade to unlock premium learning tracks, deeper analytics, and stronger personalization.
            </Typography>

            {isAuthenticated && subscriptionQuery.data?.isActive ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                <Chip label={`Current plan: ${String(currentPlan).toUpperCase()}`} sx={{ width: 'fit-content', bgcolor: '#edf8f0', color: '#1f7749' }} />
                <Button
                  variant="outlined"
                  onClick={() => customerPortalMutation.mutate()}
                  disabled={customerPortalMutation.isPending}
                  sx={{ width: 'fit-content', whiteSpace: 'nowrap' }}
                >
                  {customerPortalMutation.isPending ? 'Opening portal...' : 'Manage subscription in Stripe Portal'}
                </Button>
              </Stack>
            ) : null}

            <Grid container spacing={{ xs: 1.2, md: 2.2 }} sx={{ mt: 0.6 }}>
              {plans.map((plan) => {
                const isCurrent = currentPlan === plan.id

                return (
                  <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', p: 0.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <CardContent sx={{ p: { xs: 2, md: 2.8 }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography variant="h5">{plan.title}</Typography>
                            {plan.badge ? <Chip label={plan.badge} size="small" sx={{ bgcolor: '#f0f7ff', color: '#0c4b83' }} /> : null}
                          </Stack>
                          <Typography sx={{ mt: 1.2, fontSize: { xs: 30, md: 36 }, fontWeight: 800, lineHeight: 1 }}>
                            {plan.monthly}
                            <Typography component="span" sx={{ ml: 0.6, fontSize: 15, color: 'text.secondary', fontWeight: 600 }}>
                              /mo
                            </Typography>
                          </Typography>
                          <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>{plan.subtitle}</Typography>

                          <Stack spacing={0.9} sx={{ mt: 2.2 }}>
                            {plan.features.map((feature) => (
                              <Typography key={feature} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, color: 'text.primary', fontSize: 14 }}>
                                <CheckCircle2 size={14} /> {feature}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>

                        <Box sx={{ mt: 2.2 }}>
                          {plan.id === 'free' ? (
                            <Button component={Link} to="/register" variant="outlined" fullWidth sx={{ whiteSpace: 'nowrap' }}>
                              Start free
                            </Button>
                          ) : !isAuthenticated ? (
                            <Button component={Link} to="/login" variant="contained" fullWidth sx={{ whiteSpace: 'nowrap' }}>
                              Sign in to upgrade
                            </Button>
                          ) : (
                            <Button
                              variant={plan.id === 'premium' ? 'contained' : 'outlined'}
                              color={plan.id === 'premium' ? 'secondary' : 'primary'}
                              fullWidth
                              disabled={checkoutMutation.isPending || isCurrent}
                              onClick={() => checkoutMutation.mutate(plan.id as 'pro' | 'premium')}
                              sx={{ whiteSpace: 'nowrap' }}
                              startIcon={plan.id === 'premium' ? <Crown size={14} /> : <Sparkles size={14} />}
                            >
                              {isCurrent ? 'Current plan' : `Upgrade to ${plan.title}`}
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3800}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast((current) => ({ ...current, open: false }))} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
