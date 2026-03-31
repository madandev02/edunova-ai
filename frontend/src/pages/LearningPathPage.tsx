import { Link } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Paper, Stack, Typography } from '@mui/material'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { useLearningPathQuery } from '../features/learning-path/queries'
import { usePageTitle } from '../hooks/usePageTitle'

export const LearningPathPage = () => {
  usePageTitle('Learning Path')

  const { data, isPending, isError, error, refetch } = useLearningPathQuery()

  if (isPending) {
    return <LoadingState label="Mapping your personalized path..." />
  }

  if (isError) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="No path generated yet"
        description="As soon as performance data is available, EduNova will build an ordered learning path."
      />
    )
  }

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper
        sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}
      >
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Adaptive Sequence
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Learning path ordered by need and progression
        </Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>
          Lessons are sorted by recommendation priority, learner status, and progression order from the backend.
        </Typography>
      </Paper>

      <Stack spacing={{ xs: 1, md: 1.3 }}>
        {data.items.map((item) => {
          const isCurrent = data.currentLessonId === item.id

          return (
            <Card
              key={item.id}
              sx={{
                borderRadius: 4,
                borderColor: isCurrent ? 'primary.main' : 'divider',
                bgcolor: isCurrent ? 'rgba(232,246,243,0.9)' : 'rgba(255,255,255,0.84)',
                position: 'relative',
              }}
            >
              {isCurrent ? <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: 'primary.main', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }} /> : null}
              <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'start', sm: 'center' }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                      Lesson #{item.order}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 0.6, fontSize: { xs: '1.08rem', md: '1.5rem' } }}>{item.title}</Typography>
                    <Typography sx={{ mt: 0.8, color: 'text.secondary' }}>Difficulty: {item.difficulty}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={item.priority} size="small" variant="outlined" />
                    <Chip label={item.status} size="small" sx={{ bgcolor: 'primary.light', color: 'white' }} />
                  </Stack>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'start', sm: 'center' }} sx={{ mt: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {isCurrent ? 'You are currently here in the path.' : 'Available in your personalized path.'}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>Why: {item.reason}</Typography>
                    {item.dependsOnLessonId ? (
                      <Typography sx={{ mt: 0.4, fontSize: 12, color: 'text.secondary' }}>
                        Depends on lesson #{item.dependsOnLessonId}
                      </Typography>
                    ) : null}
                  </Box>
                  <Button component={Link} to={`/app/lessons/${item.id}`} variant="contained" size="small" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    Open lesson
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}
