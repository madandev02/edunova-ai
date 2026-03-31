import { ArrowRight, Brain, ChartColumnIncreasing, Play, Sparkles, Target } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Box, Button, Card, CardContent, Chip, Grid, Paper, Stack, Typography } from '@mui/material'
import { GlobalNavbar } from '../components/navigation/GlobalNavbar'
import { useQuery } from '@tanstack/react-query'
import { LoadingState } from '../components/states/LoadingState'
import { usePageTitle } from '../hooks/usePageTitle'
import { apiService } from '../services/api'

const features = [
  {
    title: 'Adaptive recommendations',
    description: 'EduNova analyzes your attempts and recommends what to learn next, with explicit reasoning.',
    icon: Sparkles,
  },
  {
    title: 'Structured learning',
    description: 'Course-marketplace experience with modules, lessons, and progression built for mastery.',
    icon: Brain,
  },
  {
    title: 'Real analytics',
    description: 'See your weak areas, trend curves, and success rates in actionable dashboards.',
    icon: ChartColumnIncreasing,
  },
]

const metrics = [
  { label: 'Learner retention', value: '89%' },
  { label: 'Avg weekly streak', value: '5.2 days' },
  { label: 'Recommendation precision', value: '92%' },
]

export const LandingPage = () => {
  usePageTitle('Learn smarter with AI')
  const location = useLocation()

  useEffect(() => {
    const hash = location.hash || window.location.hash
    if (!hash) {
      return
    }

    const sectionId = hash.replace('#', '')
    let attempts = 0

    const scrollToSection = () => {
      const target = document.getElementById(sectionId)
      if (!target) {
        attempts += 1
        if (attempts < 6) {
          window.setTimeout(scrollToSection, 120)
        }
        return
      }

      const y = target.getBoundingClientRect().top + window.scrollY - 84
      window.scrollTo({ top: y, behavior: 'smooth' })
    }

    scrollToSection()
  }, [location.hash])

  const publicCoursesQuery = useQuery({
    queryKey: ['public-courses-preview'],
    queryFn: () => apiService.getPublicCourses({ limit: 6 }),
  })

  const sectionContainerSx = {
    maxWidth: '1280px',
    mx: 'auto',
    px: { xs: 1.6, sm: 2.4, md: 4 },
  }

  return (
    <Box sx={{ minHeight: '100vh', py: { xs: 2, md: 2.5 } }}>
      <Box sx={sectionContainerSx}>
        <GlobalNavbar compact />
      </Box>

      <Box id="top" component="section" sx={{ ...sectionContainerSx, py: { xs: 6, md: 10 } }}>
        <Grid container spacing={{ xs: 5, lg: 8 }} alignItems="center" sx={{ gridTemplateColumns: { lg: '1fr 1fr' } }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3} sx={{ maxWidth: 640 }}>
              <Chip
                icon={<Target size={14} />}
                label="Learn smarter with AI"
                sx={{
                  width: 'fit-content',
                  borderRadius: 999,
                  bgcolor: 'rgba(204,122,69,0.14)',
                  border: '1px solid rgba(204,122,69,0.35)',
                  color: 'secondary.dark',
                  fontWeight: 700,
                }}
              />
              <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', sm: '2.25rem', md: '3.4rem' }, lineHeight: 1.08, maxWidth: 760 }}>
                Adaptive learning that behaves like a focused coaching team.
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.12rem' }, maxWidth: '36rem' }}>
                EduNova combines structured curriculum, recommendation logic, and practical analytics so every session has a clear next step.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.3}>
                <Button data-testid="landing-register-cta" component={Link} to="/register" variant="contained" size="large" endIcon={<ArrowRight size={16} />} sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
                  Start free trial
                </Button>
                <Button data-testid="landing-explore-catalog" component="a" href="#course-preview" variant="outlined" size="large" startIcon={<Play size={14} />} sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
                  Explore catalog
                </Button>
                <Button data-testid="landing-login-cta" component={Link} to="/login" variant="text" color="inherit" sx={{ fontWeight: 700, height: 48, width: { xs: '100%', sm: 'auto' } }}>
                  Log in
                </Button>
              </Stack>

              <Grid container spacing={1.4}>
                {metrics.map((metric) => (
                  <Grid key={metric.label} size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 8px 20px rgba(42,58,70,0.08)', bgcolor: 'rgba(255,255,255,0.78)' }}>
                      <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
                        <Typography sx={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' }}>
                          {metric.label}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 0.4, fontWeight: 800 }}>{metric.value}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.82)', boxShadow: '0 12px 26px rgba(36,54,69,0.1)' }}>
              <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
                  How it works
                </Typography>
                <Stack spacing={1.3} sx={{ mt: 2 }}>
                  <Paper variant="outlined" sx={{ borderRadius: 3, px: 1.8, py: 1.2 }}>1. Pick a track from a curated catalog.</Paper>
                  <Paper variant="outlined" sx={{ borderRadius: 3, px: 1.8, py: 1.2 }}>2. Learn with video sections and transcript notes.</Paper>
                  <Paper variant="outlined" sx={{ borderRadius: 3, px: 1.8, py: 1.2 }}>3. Recommendations re-prioritize weak topics automatically.</Paper>
                  <Paper variant="outlined" sx={{ borderRadius: 3, px: 1.8, py: 1.2 }}>4. Resume unfinished lessons in one click.</Paper>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box component="section" sx={{ ...sectionContainerSx, py: { xs: 6, md: 10 } }}>
        <Grid container spacing={2.2}>
          {features.map(({ title, description, icon: Icon }) => (
            <Grid key={title} size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 10px 22px rgba(42,58,70,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'inline-flex', p: 1.2, borderRadius: 2.5, bgcolor: 'primary.light', color: 'white' }}>
                    <Icon size={17} />
                  </Box>
                  <Typography variant="h5" sx={{ mt: 2.2, fontSize: { xs: '1.1rem', md: '1.5rem' } }}>{title}</Typography>
                  <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>{description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box id="course-preview" component="section" sx={{ ...sectionContainerSx, py: { xs: 6, md: 10 } }}>
        <Card sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.82)', boxShadow: '0 12px 24px rgba(39,56,68,0.08)' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', md: 'end' }} spacing={2}>
              <Box>
                <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'primary.main', fontWeight: 700 }}>
                  Public catalog preview
                </Typography>
                <Typography variant="h4" sx={{ mt: 1.2, maxWidth: '44rem', fontSize: { xs: '1.5rem', sm: '2rem' } }}>See what you can learn before creating an account</Typography>
              </Box>
              <Button component={Link} to="/register" variant="contained" size="large" sx={{ fontWeight: 700, width: { xs: '100%', md: 'auto' } }}>Unlock adaptive mode</Button>
            </Stack>

            {publicCoursesQuery.isPending ? <Box sx={{ mt: 3 }}><LoadingState label="Loading featured courses..." /></Box> : null}

            {publicCoursesQuery.isError ? (
              <Paper sx={{ mt: 3, p: 2, borderRadius: 3, bgcolor: '#fff3f0', color: 'error.main', border: '1px solid #f5cec7' }}>
                Unable to load course preview right now.
              </Paper>
            ) : null}

            {publicCoursesQuery.data ? (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {publicCoursesQuery.data.map((course) => (
                  <Grid key={course.id} size={{ xs: 12, md: 6, lg: 4 }}>
                    <Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0 8px 18px rgba(42,58,70,0.07)' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                          {course.category}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 1 }}>{course.title}</Typography>
                        <Typography sx={{ mt: 1, color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.description}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                          <Chip label={course.difficulty.toLowerCase()} size="small" sx={{ bgcolor: 'primary.light', color: 'white' }} />
                          <Chip label={`${course.modules_count} modules`} size="small" variant="outlined" />
                          <Chip label={`${course.estimated_time_hours}h`} size="small" variant="outlined" />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : null}
          </CardContent>
        </Card>
      </Box>

      <Box id="pricing" component="section" sx={{ ...sectionContainerSx, py: { xs: 6, md: 10 } }}>
        <Grid container spacing={2.2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 10px 22px rgba(42,58,70,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5">Testimonials</Typography>
                <Typography sx={{ mt: 1.5, color: 'text.secondary' }}>
                  "EduNova finally helped me understand recursion because it adapted content sequencing based on my weak spots."
                </Typography>
                <Typography sx={{ mt: 1.5, fontSize: 13, color: 'text.secondary' }}>Maria, Software Engineering Student</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 4, height: '100%', boxShadow: '0 10px 22px rgba(42,58,70,0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5">Pricing</Typography>
                <Typography sx={{ mt: 1.5, color: 'text.secondary' }}>
                  Starter from $12/month. Pro with advanced analytics and mentor workflows from $29/month.
                </Typography>
                <Button component={Link} to="/register" variant="contained" size="large" sx={{ mt: 3, fontWeight: 700 }}>
                  Start free trial
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
