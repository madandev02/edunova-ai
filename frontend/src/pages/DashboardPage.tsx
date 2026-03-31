import { Activity, Gauge, Layers, Sparkles, Target, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Grid, LinearProgress, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { RecommendationCard } from '../components/dashboard/RecommendationCard'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { useDashboardQuery } from '../features/dashboard/queries'
import { usePageTitle } from '../hooks/usePageTitle'

export const DashboardPage = () => {
  usePageTitle('Dashboard')

  const { data, isPending, isError, error, refetch } = useDashboardQuery()

  if (isPending) {
    return (
      <Stack spacing={2.2}>
        <LoadingState label="Syncing your adaptive dashboard..." />
        <Grid container spacing={2.2}>
          <Grid size={{ xs: 12, xl: 8 }}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="text" width="32%" height={24} />
                <Skeleton variant="text" width="74%" height={48} sx={{ mt: 1 }} />
                <Skeleton variant="rounded" height={100} sx={{ mt: 2, borderRadius: 3 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, xl: 4 }}>
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="rounded" height={120} sx={{ mt: 1.5, borderRadius: 3 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    )
  }

  if (isError) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const progressValue = Math.round(data.progress.percentage * 100) / 100
  const currentFocus = data.recommendations[0]
  const topSkills = [...data.skillProfile].sort((a, b) => b.score - a.score).slice(0, 3)

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper
        sx={{
          borderRadius: 5,
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 1.8, md: 3.2 },
          bgcolor: 'rgba(255,255,255,0.74)',
        }}
      >
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'primary.main', fontWeight: 700 }}>
          Learning Intelligence
        </Typography>
        <Typography variant="h3" sx={{ mt: 1.2, fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.7rem' } }}>
          Adaptive command center
        </Typography>
        <Typography sx={{ mt: 1.3, color: 'text.secondary', maxWidth: 900, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Product-grade dashboard built for fast decisions: performance, weak areas, recommendations, and resume continuity in one flow.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Sparkles size={13} />} label="Live recommendation signals" sx={{ bgcolor: 'primary.light', color: 'white' }} />
          <Chip label={`${data.recommendations.length} active priorities`} variant="outlined" />
          <Chip label={`${data.resumeLessons.length} resume items`} variant="outlined" />
        </Stack>
      </Paper>

      <Grid container spacing={{ xs: 1.6, md: 2.2 }}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Stack spacing={{ xs: 1.6, md: 2.2 }}>
            <Grid container spacing={{ xs: 1.2, md: 2 }}>
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ height: '100%', borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                      <Gauge size={14} /> Progress
                    </Typography>
                    <Typography variant="h3" sx={{ mt: 1.5 }}>{progressValue}%</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, progressValue)}
                      sx={{ mt: 2, height: 10, borderRadius: 99, bgcolor: '#e9e1d7', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
                    />
                    <Typography sx={{ mt: 1.4, color: 'text.secondary', fontSize: 13 }}>
                      Curriculum completion and mastery checkpoints.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ height: '100%', borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                      <Layers size={14} /> Current level
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 1.6 }}>{data.progress.currentLevel}</Typography>
                    <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 13 }}>
                      Adjusted from onboarding and assessment performance.
                    </Typography>
                    <Chip icon={<Zap size={13} />} label="Adaptive profile active" sx={{ mt: 2, bgcolor: 'primary.light', color: 'white' }} />
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Card sx={{ height: '100%', borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6 }}>
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                          <Target size={14} /> Weak areas
                        </Typography>
                        <Typography variant="h4" color="error.main" sx={{ mt: 1 }}>{data.weakAreas.length}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                          <Activity size={14} /> Attempts
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>{data.recentActivity.length}</Typography>
                      </Grid>
                    </Grid>

                    <Grid container spacing={1.2} sx={{ mt: 1.2 }}>
                      <Grid size={{ xs: 6 }}>
                        <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.2, bgcolor: '#fff8ed' }}>
                          <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'secondary.dark' }}>XP</Typography>
                          <Typography variant="h6" sx={{ mt: 0.4 }}>{data.gamification.xp}</Typography>
                        </Paper>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.2, bgcolor: '#f4fbf6' }}>
                          <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'success.main' }}>Streak</Typography>
                          <Typography variant="h6" sx={{ mt: 0.4 }}>{data.gamification.streakDays} days</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.4}>
                  <Box>
                    <Typography variant="h5">AI Recommendations</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>Every recommendation includes reasoning from your performance.</Typography>
                  </Box>
                  <Button component={Link} to="/app/learning-path" variant="outlined" sx={{ whiteSpace: 'nowrap', px: 2, py: 1, width: { xs: '100%', sm: 'auto' } }}>
                    Open path
                  </Button>
                </Stack>

                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  {data.recommendations.length === 0 ? (
                    <EmptyState title="No recommendations yet" description="Complete more lessons so EduNova can infer personalized priorities." />
                  ) : (
                    data.recommendations.map((recommendation) => (
                      <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6">Recent Activity</Typography>
                <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: 14 }}>Latest attempts from the recommendation engine feed.</Typography>

                {data.recentActivity.length === 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <EmptyState title="No attempts recorded" description="Your latest quiz attempts will appear here with scores and timestamps." />
                  </Box>
                ) : (
                  <Box sx={{ mt: 2, overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 620 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Topic</TableCell>
                          <TableCell>Score</TableCell>
                          <TableCell>Attempted</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.recentActivity.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell sx={{ fontWeight: 700 }}>{item.topic}</TableCell>
                            <TableCell sx={{ color: item.score < 50 ? 'error.main' : 'success.main', fontWeight: 700 }}>{item.score}%</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{new Date(item.attemptedAt).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={{ xs: 1.6, md: 2.2 }}>
            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
                  Current focus
                </Typography>
                {currentFocus ? (
                  <>
                    <Typography variant="h6" sx={{ mt: 1.2 }}>{currentFocus.topic}</Typography>
                    <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: 13 }}>{currentFocus.reason}</Typography>
                    <Button
                      component={Link}
                      to="/app/learning-path"
                      variant="outlined"
                      sx={{ mt: 2, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 2, py: 1 }}
                    >
                      Open recommended path
                    </Button>
                  </>
                ) : (
                  <Typography sx={{ mt: 1.4, color: 'text.secondary' }}>
                    Complete a lesson to generate your next focus automatically.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5">Continue Learning</Typography>
                <Typography sx={{ mt: 0.7, color: 'text.secondary', fontSize: 14 }}>Jump back into lessons exactly where you left off.</Typography>
                {data.resumeLessons.length === 0 ? (
                  <Box sx={{ mt: 1.8 }}>
                    <EmptyState title="No resume items" description="Start watching a lesson video and your resume chips will appear here." />
                  </Box>
                ) : (
                  <Stack spacing={1} sx={{ mt: 1.8 }}>
                    {data.resumeLessons.map((item) => (
                      <Paper key={item.lessonId} variant="outlined" sx={{ borderRadius: 3, p: 1.4, transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 16px rgba(28, 63, 58, 0.08)' } }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography sx={{ fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.courseTitle ?? 'Course'} - {item.lessonTitle}
                            </Typography>
                            <Chip size="small" label={`${Math.round(item.completionRatio * 100)}%`} variant="outlined" />
                          </Stack>

                          <LinearProgress
                            variant="determinate"
                            value={Math.max(2, Math.min(100, Math.round(item.completionRatio * 100)))}
                            sx={{ height: 8, borderRadius: 99, bgcolor: '#ece4da', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
                          />

                          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                              Last watched: {item.lastWatchedAt ? new Date(item.lastWatchedAt).toLocaleString() : 'Unknown'}
                            </Typography>
                            <Button
                              component={Link}
                              to={item.courseId ? `/app/learn/${item.courseId}` : `/app/lessons/${item.lessonId}`}
                              variant="contained"
                              size="small"
                            >
                              Resume
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6">Weak Areas</Typography>
                <Typography sx={{ mt: 0.7, color: 'text.secondary', fontSize: 14 }}>Low scores are highlighted to focus effort.</Typography>
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  {data.weakAreas.length === 0 ? (
                    <EmptyState title="No weak areas" description="Keep submitting quizzes to maintain strong coverage." />
                  ) : (
                    data.weakAreas.map((area) => (
                      <Paper key={area.topic} variant="outlined" sx={{ borderRadius: 3, p: 1.4, bgcolor: '#fff3f2', borderColor: '#f3d5d2' }}>
                        <Typography sx={{ fontWeight: 700, color: 'error.main' }}>{area.topic}</Typography>
                        <Typography sx={{ mt: 0.4, fontSize: 13, color: '#8b3f37' }}>Average score: {area.score}%</Typography>
                      </Paper>
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6">Achievements</Typography>
                <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: 14 }}>Productive streaks and milestones become visible badges.</Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                  {data.gamification.achievements.length === 0 ? (
                    <Typography sx={{ color: 'text.secondary' }}>Complete your first lesson to unlock your first badge.</Typography>
                  ) : (
                    data.gamification.achievements.map((badge) => (
                      <Chip key={badge} label={badge} sx={{ bgcolor: '#ecf9ef', color: '#1c7949' }} />
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6">Skill Engine Snapshot</Typography>
                <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: 14 }}>Scores update from outcomes, attempts, and time invested.</Typography>
                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  {data.skillProfile.length === 0 ? (
                    <EmptyState title="No skill profile yet" description="Start your first lesson to unlock personalized skill tracking." />
                  ) : (
                    data.skillProfile.map((item) => (
                      <Paper key={item.topic} variant="outlined" sx={{ borderRadius: 3, p: 1.4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ fontWeight: 700 }}>{item.topic}</Typography>
                          <Typography sx={{ fontWeight: 700 }}>{Math.round(item.score * 100)}%</Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.round(item.score * 100)}
                          sx={{ mt: 1.2, height: 8, borderRadius: 99, bgcolor: '#ece4da', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
                        />
                      </Paper>
                    ))
                  )}
                </Stack>

                {topSkills.length > 0 ? (
                  <Paper variant="outlined" sx={{ mt: 2, borderRadius: 3, p: 1.4, bgcolor: '#f6f9ff' }}>
                    <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                      Top strengths
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.2 }}>
                      {topSkills.map((item) => (
                        <Chip key={item.topic} label={`${item.topic} ${Math.round(item.score * 100)}%`} sx={{ bgcolor: '#e8f2ff', color: '#0d4f86' }} />
                      ))}
                    </Stack>
                  </Paper>
                ) : null}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  )
}
