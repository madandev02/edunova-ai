import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Alert, Box, Button, Card, CardContent, Checkbox, Chip, Container, FormControlLabel, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { EmptyState } from '../components/states/EmptyState'
import { useOnboardingCompleteMutation, useOnboardingStatusQuery } from '../features/auth/queries'
import { useAuth } from '../features/auth/AuthProvider'
import { usePageTitle } from '../hooks/usePageTitle'
import { GlobalNavbar } from '../components/navigation/GlobalNavbar'

type AssessmentDifficulty = 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED'

interface AssessmentQuestion {
  id: string
  text: string
  difficulty: AssessmentDifficulty
}

const baseAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'core-frontend-backend-responsibilities',
    text: 'I can explain the difference between frontend and backend responsibilities.',
    difficulty: 'FOUNDATIONAL',
  },
  {
    id: 'core-api-http-basics',
    text: 'I understand how APIs and HTTP requests work in real applications.',
    difficulty: 'INTERMEDIATE',
  },
  {
    id: 'core-code-reasoning',
    text: 'I can read and reason about basic code with loops and functions.',
    difficulty: 'INTERMEDIATE',
  },
]

const advancedFollowUp: AssessmentQuestion[] = [
  {
    id: 'advanced-time-complexity',
    text: 'I can reason about time complexity tradeoffs for common algorithms.',
    difficulty: 'ADVANCED',
  },
  {
    id: 'advanced-backend-api-design',
    text: 'I can design a backend endpoint with validation and secure auth.',
    difficulty: 'ADVANCED',
  },
]

const foundationalFollowUp: AssessmentQuestion[] = [
  {
    id: 'foundational-variables-loops-conditionals',
    text: 'I understand variables, loops, and conditional statements.',
    difficulty: 'FOUNDATIONAL',
  },
  {
    id: 'foundational-api-request-response',
    text: 'I can explain what an API request and response are.',
    difficulty: 'FOUNDATIONAL',
  },
]

const interestsOptions = ['frontend', 'backend', 'ai', 'data', 'product']
const goals = ['Get a job', 'Learn new skill', 'Improve current knowledge']

export const OnboardingPage = () => {
  usePageTitle('Onboarding')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const statusQuery = useOnboardingStatusQuery(isAuthenticated)
  const completeMutation = useOnboardingCompleteMutation()

  const [goal, setGoal] = useState(goals[0])
  const [interests, setInterests] = useState<string[]>(['frontend'])
  const [experienceLevel, setExperienceLevel] = useState('BEGINNER')
  const [answers, setAnswers] = useState<Record<string, boolean>>({})

  const adaptiveQuestions = (() => {
    const confidence = baseAssessmentQuestions.filter((question) => answers[question.id]).length
    return confidence >= 2 ? advancedFollowUp : foundationalFollowUp
  })()

  const activeQuestions = [...baseAssessmentQuestions, ...adaptiveQuestions]

  const structuredAnswers = activeQuestions.map((question) => ({
    question_id: question.id,
    difficulty: question.difficulty,
    correct: answers[question.id] ?? false,
  }))

  const isAlreadyCompleted = statusQuery.data?.completed

  const resultSummary = useMemo(() => {
    if (!completeMutation.data) {
      return null
    }

    return {
      level: completeMutation.data.level,
      courseTitle: completeMutation.data.first_course_title,
      lessonCount: completeMutation.data.generated_learning_path_lesson_ids.length,
    }
  }, [completeMutation.data])

  const toggleInterest = (value: string) => {
    setInterests((previous) => {
      if (previous.includes(value)) {
        return previous.filter((item) => item !== value)
      }
      return [...previous, value]
    })
  }

  const submit = () => {
    completeMutation.mutate(
      {
        goal,
        interests,
        experience_level: experienceLevel,
        assessment_answers: structuredAnswers,
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            navigate('/app/dashboard', { replace: true })
          }, 1100)
        },
      },
    )
  }

  if (statusQuery.isSuccess && isAlreadyCompleted) {
    return (
      <Box sx={{ mx: 'auto', display: 'flex', minHeight: '100vh', width: '100%', maxWidth: '42rem', alignItems: 'center', px: 2 }}>
        <EmptyState
          title="Onboarding already completed"
          description="Your profile is ready. Redirecting to your dashboard..."
        />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ minHeight: '100vh', py: { xs: 2, md: 3 } }}>
      <GlobalNavbar compact mode="app" />
      <Paper
        sx={{ mt: 2, borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.76)' }}
      >
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'primary.main', fontWeight: 700 }}>
          Smart onboarding
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>Let EduNova build your personalized learning journey</Typography>
        <Typography sx={{ mt: 1.2, color: 'text.secondary' }}>
          We use your goals, interests, and baseline answers to assign your level and recommend your first course.
        </Typography>

        <Stack spacing={{ xs: 1.8, md: 2.4 }} sx={{ mt: 2.2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>1. What is your main goal?</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              {goals.map((item) => (
                <Button key={item} type="button" onClick={() => setGoal(item)} variant={goal === item ? 'contained' : 'outlined'} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  {item}
                </Button>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 700 }}>2. Choose your interests</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              {interestsOptions.map((item) => {
                const selected = interests.includes(item)
                return (
                  <Button key={item} type="button" onClick={() => toggleInterest(item)} variant={selected ? 'contained' : 'outlined'} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    {item}
                  </Button>
                )
              })}
            </Stack>
            {interests.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 1.2 }}>
                Pick at least one interest so EduNova can build your first path.
              </Alert>
            ) : null}
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 700 }}>3. Select your experience level</Typography>
            <TextField
              select
              value={experienceLevel}
              onChange={(event) => setExperienceLevel(event.target.value)}
              sx={{ mt: 1, minWidth: { xs: '100%', sm: 230 } }}
            >
              <MenuItem value="BEGINNER">Beginner</MenuItem>
              <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
              <MenuItem value="ADVANCED">Advanced</MenuItem>
            </TextField>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 700 }}>4. Quick adaptive assessment</Typography>
            <Grid container spacing={1.2} sx={{ mt: 0.5 }}>
              {[...baseAssessmentQuestions, ...adaptiveQuestions].map((question) => (
                <Grid key={question.id} size={{ xs: 12 }}>
                  <Card sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.82)' }}>
                    <CardContent sx={{ py: 1.2, '&:last-child': { pb: 1.2 } }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={answers[question.id] ?? false}
                            onChange={(event) => {
                              setAnswers((previous) => ({
                                ...previous,
                                [question.id]: event.target.checked,
                              }))
                            }}
                          />
                        }
                        label={
                          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                            <Typography>{question.text}</Typography>
                            <Chip label={question.difficulty.toLowerCase()} size="small" variant="outlined" />
                          </Stack>
                        }
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>

        {completeMutation.isError ? <Alert severity="error" sx={{ mt: 2 }}>{(completeMutation.error as Error).message}</Alert> : null}

        {resultSummary ? (
          <Paper sx={{ mt: 2, borderRadius: 3, p: 2, bgcolor: '#edf8f0', color: '#1b6f41' }}>
            <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
              <Sparkles size={15} /> Onboarding complete
            </Typography>
            <Typography sx={{ mt: 1 }}>Assigned level: {resultSummary.level}</Typography>
            <Typography>Recommended first course: {resultSummary.courseTitle ?? 'No specific course yet'}</Typography>
            <Typography>Initial path contains {resultSummary.lessonCount} lessons.</Typography>
            {completeMutation.data?.assessment_score !== undefined && completeMutation.data?.assessment_score !== null ? (
              <Typography sx={{ mt: 0.4 }}>Assessment confidence score: {completeMutation.data.assessment_score}%</Typography>
            ) : null}
            {completeMutation.data?.rationale ? <Typography sx={{ mt: 0.8 }}>{completeMutation.data.rationale}</Typography> : null}
          </Paper>
        ) : null}

        <Button
          data-testid="onboarding-submit"
          type="button"
          onClick={submit}
          disabled={completeMutation.isPending || interests.length === 0}
          variant="contained"
          sx={{ mt: 2.5, width: { xs: '100%', sm: 'auto' } }}
        >
          {completeMutation.isPending ? 'Generating your plan...' : 'Generate my learning path'}
        </Button>
      </Paper>
    </Container>
  )
}
