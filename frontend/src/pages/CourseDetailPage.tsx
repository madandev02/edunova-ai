import { Link, useParams } from 'react-router-dom'
import { Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { UpgradeRequiredState } from '../components/states/UpgradeRequiredState'
import { CourseReviewsSection } from '../components/CourseReviewsSection'
import { CourseDiscussionsSection } from '../components/CourseDiscussionsSection'
import { useCourseDetailQuery } from '../features/courses/queries'
import { usePageTitle } from '../hooks/usePageTitle'
import { ApiError } from '../services/api'

export const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  usePageTitle('Course detail')

  const { data, isPending, isError, error, refetch } = useCourseDetailQuery(courseId)

  if (!courseId) {
    return <EmptyState title="Course missing" description="Select a course from the marketplace first." />
  }

  if (isPending) {
    return <LoadingState label="Loading course details..." />
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 402) {
      return (
        <UpgradeRequiredState
          title="Premium course locked"
          description="This course is part of paid plans. Upgrade to Pro or Premium to open the full curriculum."
        />
      )
    }
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper
        sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}
      >
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Course Detail
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>{data.title}</Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary', fontSize: { xs: '0.92rem', sm: '1rem' } }}>{data.description}</Typography>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
          <Chip label={data.category} size="small" variant="outlined" />
          <Chip label={data.difficulty} size="small" sx={{ bgcolor: 'primary.light', color: 'white' }} />
          <Chip label={`${data.estimated_time_hours}h`} size="small" variant="outlined" />
          <Chip label={`${data.lessons_count} lessons`} size="small" variant="outlined" />
          <Chip label={`Progress ${data.progress_percentage}%`} size="small" sx={{ bgcolor: '#ebf7ef', color: '#1e7a4c' }} />
        </Stack>

        <Grid container spacing={1.4} sx={{ mt: 1.2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5, bgcolor: '#fffdfa' }}>
              <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                Learning objectives
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {data.learning_objectives.map((objective) => (
                  <Typography key={objective} sx={{ fontSize: 14, color: 'text.secondary' }}>
                    - {objective}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5, bgcolor: '#fffdfa' }}>
              <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                Prerequisites
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {data.prerequisites.map((prerequisite) => (
                  <Typography key={prerequisite} sx={{ fontSize: 14, color: 'text.secondary' }}>
                    - {prerequisite}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Button data-testid="course-start-resume" component={Link} to={`/app/learn/${data.id}`} variant="contained" sx={{ mt: 2.2, width: { xs: '100%', sm: 'auto' } }}>
          {data.progress_percentage > 0 ? 'Continue course' : 'Start course'}
        </Button>
      </Paper>

      <Stack spacing={{ xs: 1.1, md: 1.4 }}>
        {data.modules.map((module) => (
          <Card key={module.id} sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: { xs: 1.8, md: 2.4 } }}>
              <Typography variant="h6">{module.title}</Typography>
              <Stack spacing={1} sx={{ mt: 1.4 }}>
                {module.lessons.map((lesson) => (
                  <Paper key={lesson.id} variant="outlined" sx={{ borderRadius: 3, px: 1.6, py: 1.2, bgcolor: 'rgba(255,255,255,0.72)' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1}>
                      <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                        #{String(lesson.order_index)} {lesson.title} ({lesson.difficulty})
                      </Typography>
                      <Button component={Link} to={`/app/lessons/${lesson.id}`} size="small" variant="outlined" sx={{ width: { xs: '100%', sm: 'auto' }, whiteSpace: 'nowrap' }}>
                        Open lesson
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Paper sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 2.2, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}>
        <CourseReviewsSection courseId={String(data.id)} />
      </Paper>

      <Paper sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 2.2, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}>
        <CourseDiscussionsSection courseId={String(data.id)} />
      </Paper>
    </Stack>
  )
}
