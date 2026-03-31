import { RefreshCcw, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { useAuth } from '../features/auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { isAdminUser } from '../lib/admin'
import { ApiError, apiService } from '../services/api'

export const AdminBillingEventsPage = () => {
  usePageTitle('Admin Billing Events')
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [toast, setToast] = useState<{ open: boolean; severity: 'success' | 'error' | 'info'; message: string }>({
    open: false,
    severity: 'info',
    message: '',
  })
  const [payloadModal, setPayloadModal] = useState<{ open: boolean; value: string }>({
    open: false,
    value: '',
  })

  const isAdmin = isAdminUser(user)

  const eventsQuery = useQuery({
    queryKey: ['admin-billing-events', statusFilter, eventTypeFilter],
    queryFn: () =>
      apiService.getWebhookEvents({
        limit: 50,
        status: statusFilter || undefined,
        eventType: eventTypeFilter || undefined,
      }),
    enabled: isAdmin,
  })

  const retryMutation = useMutation({
    mutationFn: (eventId: number) => apiService.retryWebhookEvent(eventId),
    onSuccess: () => {
      void eventsQuery.refetch()
      setToast({ open: true, severity: 'success', message: 'Webhook event reprocessed successfully.' })
    },
    onError: (error) => {
      setToast({ open: true, severity: 'error', message: error.message })
    },
  })

  const availableEventTypes = useMemo(() => {
    const set = new Set((eventsQuery.data?.items ?? []).map((item) => item.eventType))
    return Array.from(set.values()).sort()
  }, [eventsQuery.data?.items])

  if (!isAdmin) {
    return (
      <ErrorState
        message="Admin access required for billing operations."
        onRetry={() => undefined}
      />
    )
  }

  if (eventsQuery.isError) {
    const queryError = eventsQuery.error
    if (queryError instanceof ApiError && queryError.status === 403) {
      return <ErrorState message="Backend denied access to billing events." onRetry={() => void eventsQuery.refetch()} />
    }
    return <ErrorState message={eventsQuery.error.message} onRetry={() => void eventsQuery.refetch()} />
  }

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.78)' }}>
        <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          <ShieldCheck size={14} /> Admin billing ops
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Stripe webhook lifecycle events
        </Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>
          Filter events by status/type, inspect failures, and retry failed processing.
        </Typography>

        <Grid container spacing={{ xs: 1, md: 1.2 }} sx={{ mt: 1.2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField select label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} fullWidth>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="processed">Processed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <TextField select label="Event type" value={eventTypeFilter} onChange={(event) => setEventTypeFilter(event.target.value)} fullWidth>
              <MenuItem value="">All</MenuItem>
              {availableEventTypes.map((eventType) => (
                <MenuItem key={eventType} value={eventType}>{eventType}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Button variant="outlined" fullWidth sx={{ height: 56 }} onClick={() => void eventsQuery.refetch()}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {eventsQuery.isPending ? <LoadingState label="Loading webhook events..." /> : null}

      {eventsQuery.data && eventsQuery.data.items.length === 0 ? (
        <EmptyState title="No webhook events" description="No matching events for current filters." />
      ) : null}

      <Stack spacing={1.2}>
        {(eventsQuery.data?.items ?? []).map((item) => (
          <Card key={item.id} sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 2.2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.2}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{item.eventType}</Typography>
                  <Typography sx={{ mt: 0.4, color: 'text.secondary', fontSize: 13 }}>
                    Event ID: {item.stripeEventId ?? 'N/A'}
                  </Typography>
                  <Typography sx={{ mt: 0.3, color: 'text.secondary', fontSize: 13 }}>
                    User: {item.userId ?? 'N/A'}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" alignItems="center">
                  <Chip size="small" label={item.status} sx={{ bgcolor: item.status === 'processed' ? '#edf8f0' : item.status === 'failed' ? '#fff1ef' : '#f6f6f6', color: item.status === 'processed' ? '#1f7749' : item.status === 'failed' ? '#b42318' : '#58677a' }} />
                  <Chip size="small" label={new Date(item.createdAt).toLocaleString()} variant="outlined" />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      let pretty = '{\n  "message": "No payload available"\n}'
                      if (item.payloadJson) {
                        try {
                          pretty = JSON.stringify(JSON.parse(item.payloadJson), null, 2)
                        } catch {
                          pretty = item.payloadJson
                        }
                      }
                      setPayloadModal({ open: true, value: pretty })
                    }}
                  >
                    View payload
                  </Button>
                  {item.status === 'failed' ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      disabled={retryMutation.isPending}
                      onClick={() => retryMutation.mutate(item.id)}
                      startIcon={<RefreshCcw size={14} />}
                      sx={{ whiteSpace: 'nowrap', px: 2 }}
                    >
                      Retry processing
                    </Button>
                  ) : null}
                </Stack>
              </Stack>

              {item.errorMessage ? (
                <Paper variant="outlined" sx={{ mt: 1.1, borderRadius: 2.5, p: 1.2, bgcolor: '#fff5f4', borderColor: '#f5d4d0' }}>
                  <Typography sx={{ fontSize: 13, color: 'error.main' }}>
                    {item.errorMessage}
                  </Typography>
                </Paper>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={3800}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((current) => ({ ...current, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Dialog open={payloadModal.open} onClose={() => setPayloadModal({ open: false, value: '' })} fullWidth maxWidth="md">
        <DialogTitle>Webhook Payload JSON</DialogTitle>
        <DialogContent>
          <Paper
            variant="outlined"
            sx={{
              mt: 1,
              p: 1.5,
              maxHeight: 420,
              overflow: 'auto',
              bgcolor: '#0f172a',
              color: '#e2e8f0',
              borderColor: '#1e293b',
              borderRadius: 2,
            }}
          >
            <Typography component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {payloadModal.value}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayloadModal({ open: false, value: '' })}>Close</Button>
          <Button
            variant="contained"
            onClick={async () => {
              await navigator.clipboard.writeText(payloadModal.value)
              setToast({ open: true, severity: 'success', message: 'Payload copied to clipboard.' })
            }}
          >
            Copy JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
