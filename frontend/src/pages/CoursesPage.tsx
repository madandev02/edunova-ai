import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Grid, MenuItem, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { useCoursesQuery } from '../features/courses/queries'
import { useDashboardQuery } from '../features/dashboard/queries'
import { useAuth } from '../features/auth/AuthProvider'
import { useNotification } from '../features/notifications/NotificationContext'
import { usePageTitle } from '../hooks/usePageTitle'

export const CoursesPage = () => {
  usePageTitle('Course Marketplace')
  const { isAuthenticated } = useAuth()
  const { addNotification } = useNotification()
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [search, setSearch] = useState('')

  const filters = useMemo(
    () => ({
      category: category || undefined,
      difficulty: difficulty || undefined,
      search: search || undefined,
    }),
    [category, difficulty, search],
  )

  const { data, isPending, isError, error, refetch } = useCoursesQuery(filters)
  const dashboardQuery = useDashboardQuery()
  const recommendationTopics = (dashboardQuery.data?.recommendations ?? []).map((item) => item.topic.toLowerCase())

  if (isPending) {
    return (
      <Stack spacing={2.2}>
        <Paper sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 2.2, md: 3 } }}>
          <Skeleton variant="text" width="28%" height={22} />
          <Skeleton variant="text" width="60%" height={42} sx={{ mt: 1 }} />
          <Skeleton variant="rounded" height={54} sx={{ mt: 2, borderRadius: 2 }} />
        </Paper>
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid key={`course-skeleton-${index}`} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Skeleton variant="text" width="42%" />
                  <Skeleton variant="text" width="72%" height={34} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="rounded" height={96} sx={{ mt: 2, borderRadius: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    )
  }

  if (isError) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  return (
    <Stack spacing={2.2}>
      <Paper sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}>
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Marketplace
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Explore structured courses designed for adaptive progress
        </Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Filter by domain and difficulty, then prioritize cards marked as recommended for your current profile.
        </Typography>

        <Grid container spacing={{ xs: 1, md: 1.4 }} sx={{ mt: 1.1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or description"
              label="Search"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Computer Science"
              label="Category"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} label="Difficulty" fullWidth>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {data.length === 0 ? (
        <EmptyState
          title="No matching courses yet"
          description="Try a broader filter to discover available tracks from the EduNova catalog."
        />
      ) : (
        <Grid container spacing={{ xs: 1.2, md: 2 }}>
          {data.map((course) => {
            const isRecommended = recommendationTopics.some(
              (topic) => course.title.toLowerCase().includes(topic) || course.description.toLowerCase().includes(topic),
            )
            const isLocked = Boolean(course.isLocked)

            return (
              <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                <Card data-testid={`course-card-${course.id}`} sx={{ height: '100%', borderRadius: 4, position: 'relative' }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                          {course.category}
                        </Typography>
                        {isRecommended ? <Chip label="Recommended" size="small" sx={{ bgcolor: '#edf7ee', color: '#206e42' }} /> : null}
                      </Stack>

                    {course.isPremium ? (
                      <Chip label={isLocked ? 'Premium locked' : 'Premium'} size="small" sx={{ mt: 1, bgcolor: isLocked ? '#fff4ec' : '#f0f7ff', color: isLocked ? '#9e5b31' : '#0c4b83' }} />
                    ) : null}

                      <Typography variant="h5" sx={{ mt: 1.2, fontSize: { xs: '1.08rem', md: '1.25rem' }, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</Typography>
                      <Typography sx={{ mt: 1, color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: { xs: 60, md: 72 } }}>{course.description}</Typography>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                      <Chip label={course.difficulty} size="small" sx={{ bgcolor: 'primary.light', color: 'white' }} />
                      <Chip label={`${course.modules_count} modules`} size="small" variant="outlined" />
                      <Chip label={`${course.lessons_count} lessons`} size="small" variant="outlined" />
                      <Chip label={`${course.estimated_time_hours}h`} size="small" variant="outlined" />
                    </Stack>

                      <Paper variant="outlined" sx={{ mt: 2, borderRadius: 3, p: 1.4, bgcolor: '#fffdfa' }}>
                      <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                        Learning objectives
                      </Typography>
                        <Stack spacing={0.3} sx={{ mt: 0.7 }}>
                        {course.learning_objectives.slice(0, 2).map((objective) => (
                          <Typography key={objective} sx={{ fontSize: 13, color: 'text.secondary' }}>
                            - {objective}
                          </Typography>
                        ))}
                        </Stack>
                      <Typography sx={{ mt: 1.1, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                        Prerequisite
                      </Typography>
                      <Typography sx={{ mt: 0.6, fontSize: 13, color: 'text.secondary' }}>
                        {course.prerequisites[0] ?? 'No strict prerequisite.'}
                      </Typography>
                      </Paper>

                    {course.resume_lesson_id ? (
                      <Chip
                        label={`Resume: ${course.resume_lesson_title} at ${Math.floor((course.resume_playback_seconds ?? 0) / 60)}:${`${(course.resume_playback_seconds ?? 0) % 60}`.padStart(2, '0')} (${Math.round((course.resume_completion_ratio ?? 0) * 100)}%)`}
                        size="small"
                        sx={{ mt: 2, maxWidth: '100%', bgcolor: '#e8f7ec', color: '#1b6f41' }}
                      />
                    ) : null}
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      {isLocked ? (
                        <Button
                          data-testid={`course-open-${course.id}`}
                          component={isAuthenticated ? Link : Link}
                          to={isAuthenticated ? '/pricing' : '/login'}
                          variant="outlined"
                          fullWidth
                          onClick={() => {
                            addNotification('This course requires a paid plan. Visit Pricing to upgrade.', 'info')
                          }}
                          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 2, py: 1 }}
                        >
                          Upgrade to unlock
                        </Button>
                      ) : (
                        <Button
                          data-testid={`course-open-${course.id}`}
                          component={Link}
                          to={`/app/courses/${course.id}`}
                          variant="contained"
                          fullWidth
                          sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 2, py: 1 }}
                        >
                          {course.resume_lesson_id ? 'Continue course' : 'View course'}
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

    </Stack>
  )
}
