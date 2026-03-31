import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Box, Card, CardContent, Grid, Paper, Stack, Typography } from '@mui/material'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { useAnalyticsQuery } from '../features/analytics/queries'
import { usePageTitle } from '../hooks/usePageTitle'

export const AnalyticsPage = () => {
  usePageTitle('Analytics')

  const { data, isPending, isError, error, refetch } = useAnalyticsQuery()

  if (isPending) {
    return <LoadingState label="Loading analytics models..." />
  }

  if (isError) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const hasNoData =
    data.performanceOverTime.length === 0 &&
    data.successRateByTopic.length === 0 &&
    data.attemptsPerTopic.length === 0

  if (hasNoData) {
    return (
      <EmptyState
        title="Analytics not available yet"
        description="Complete lessons and submit attempts to unlock trend analytics."
      />
    )
  }

  return (
    <Stack spacing={2.2}>
      <Paper
        sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}
      >
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Learning Insights
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Performance trends and topic outcomes</Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Charts are driven live from the backend analytics endpoint.
        </Typography>
      </Paper>

      <Grid container spacing={{ xs: 1.2, md: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: { xs: 1.8, md: 3 } }}>
              <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                Completion Rate
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontSize: { xs: '1.8rem', sm: '2.4rem' } }}>{Math.round(data.overallProgress)}%</Typography>
              <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: { xs: 12, sm: 13 } }}>
                Percentage of lessons completed.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: { xs: 1.8, md: 3 } }}>
              <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
              Success Rate  
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontSize: { xs: '1.8rem', sm: '2.4rem' } }}>{Math.round(data.successRate)}%</Typography>
              <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: 13 }}>
              Average score across attempts.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent>
              <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
            Weak Topics
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontSize: { xs: '1.8rem', sm: '2.4rem' } }}>{data.weakAreas.length}</Typography>
              <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: 13 }}>
            Topics currently below confidence threshold.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent>
              <Typography variant="h6">Performance over time</Typography>
              <Typography sx={{ mt: 0.7, color: 'text.secondary', fontSize: 14 }}>Track score trajectory over attempts.</Typography>
              <Box sx={{ mt: 2, height: 288 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.performanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9cfbf" />
                    <XAxis dataKey="date" stroke="#5f6f82" />
                    <YAxis stroke="#5f6f82" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#2f6f67" strokeWidth={3} name="Score" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent>
              <Typography variant="h6">Success rate by topic</Typography>
              <Typography sx={{ mt: 0.7, color: 'text.secondary', fontSize: 14 }}>Green indicates stronger mastery.</Typography>
              <Box sx={{ mt: 2, height: 288 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.successRateByTopic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9cfbf" />
                    <XAxis dataKey="topic" stroke="#5f6f82" />
                    <YAxis stroke="#5f6f82" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rate" name="Success %">
                      {data.successRateByTopic.map((entry) => (
                        <Cell key={entry.topic} fill={entry.rate >= 60 ? '#2f6f67' : '#cc7a45'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6">Attempts per topic</Typography>
          <Typography sx={{ mt: 0.7, color: 'text.secondary', fontSize: 14 }}>Volume helps explain recommendation urgency.</Typography>
          <Box sx={{ mt: 2, height: 288 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attemptsPerTopic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9cfbf" />
                <XAxis dataKey="topic" stroke="#5f6f82" />
                <YAxis stroke="#5f6f82" />
                <Tooltip />
                <Legend />
                <Bar dataKey="attempts" fill="#2f6f67" name="Attempts" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}
