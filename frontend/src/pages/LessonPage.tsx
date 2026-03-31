import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, Chip, FormControlLabel, Paper, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { UpgradeRequiredState } from '../components/states/UpgradeRequiredState'
import { useLessonQuery, useLessonSubmissionMutation } from '../features/lesson/queries'
import { usePageTitle } from '../hooks/usePageTitle'
import { ApiError } from '../services/api'

export const LessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>()
  usePageTitle('Lesson')

  const { data, isPending, isError, error, refetch } = useLessonQuery(lessonId)
  const submissionMutation = useLessonSubmissionMutation(lessonId)
  const [selectedAnswer, setSelectedAnswer] = useState('')

  if (!lessonId) {
    return (
      <EmptyState
        title="Lesson unavailable"
        description="A lesson identifier is required to load learning content."
      />
    )
  }

  if (isPending) {
    return <LoadingState label="Loading lesson content..." />
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 402) {
      return (
        <UpgradeRequiredState
          title="Premium lesson locked"
          description="This lesson requires an active Pro or Premium subscription. Upgrade to continue."
        />
      )
    }
    return <ErrorState message={error.message} onRetry={() => void refetch()} />
  }

  const submitAnswer = () => {
    if (!selectedAnswer) {
      return
    }

    submissionMutation.mutate({ answer: selectedAnswer })
  }

  return (
    <Stack spacing={{ xs: 1.8, md: 2.2 }}>
      <Paper
        sx={{ borderRadius: 5, border: '1px solid', borderColor: 'divider', p: { xs: 1.8, md: 3 }, bgcolor: 'rgba(255,255,255,0.74)' }}
      >
        <Typography sx={{ fontSize: { xs: 10, sm: 12 }, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'primary.main', fontWeight: 700 }}>
          Interactive Lesson
        </Typography>
        <Typography variant="h4" sx={{ mt: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>{data.title}</Typography>
        <Typography sx={{ mt: 1, color: 'text.secondary' }}>Topic: {data.topic}</Typography>
        <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 3, p: 1.4, bgcolor: '#f8fcff' }}>
          <Typography sx={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 700 }}>
            Lesson goal
          </Typography>
          <Typography sx={{ mt: 0.7, color: 'text.secondary' }}>{data.lessonGoal}</Typography>
        </Paper>
        {data.keyConcepts.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
            {data.keyConcepts.map((concept) => (
              <Chip key={concept} size="small" variant="outlined" label={concept} />
            ))}
          </Stack>
        ) : null}
      </Paper>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.8 } }}>
          <Typography variant="h6">Lesson content</Typography>
          <Stack spacing={1.2} sx={{ mt: 1.6 }}>
            {data.content.length === 0 ? (
              <EmptyState title="No content provided" description="Backend returned no content blocks for this lesson." />
            ) : (
              data.content.map((block) => (
                <Paper key={block.id} variant="outlined" sx={{ borderRadius: 3, p: 1.6, bgcolor: '#fffdfa' }}>
                  <Typography sx={{ fontWeight: 700 }}>{block.title}</Typography>
                  <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.8 }}>{block.body}</Typography>
                </Paper>
              ))
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2, md: 2.8 } }}>
          <Typography variant="h6">Knowledge check</Typography>

          {data.quizQuestion ? (
            <Stack spacing={1.6} sx={{ mt: 1.6 }}>
              <Typography sx={{ fontWeight: 700 }}>{data.quizQuestion}</Typography>

              {data.quizOptions && data.quizOptions.length > 0 ? (
                <RadioGroup value={selectedAnswer} onChange={(event) => setSelectedAnswer(event.target.value)}>
                  <Stack spacing={1}>
                    {data.quizOptions.map((option) => (
                      <Paper key={option.id} variant="outlined" sx={{ borderRadius: 3, px: 1.3, py: 0.8 }}>
                        <FormControlLabel
                          value={option.value}
                          control={<Radio />}
                          sx={{ alignItems: 'flex-start', width: '100%', m: 0 }}
                          label={<Typography sx={{ fontSize: { xs: 13, sm: 14 }, whiteSpace: 'normal', lineHeight: 1.45 }}>{option.label}</Typography>}
                        />
                      </Paper>
                    ))}
                  </Stack>
                </RadioGroup>
              ) : (
                <TextField
                  value={selectedAnswer}
                  onChange={(event) => setSelectedAnswer(event.target.value)}
                  multiline
                  minRows={4}
                  fullWidth
                  placeholder="Write your answer here..."
                />
              )}

              <Box>
                <Button type="button" onClick={submitAnswer} disabled={!selectedAnswer || submissionMutation.isPending} variant="contained">
                  {submissionMutation.isPending ? 'Submitting...' : 'Submit answer'}
                </Button>
              </Box>
            </Stack>
          ) : (
            <Box sx={{ mt: 1.6 }}>
              <EmptyState title="No quiz available" description="This lesson does not currently include a question to submit." />
            </Box>
          )}

          {submissionMutation.isError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(submissionMutation.error as Error).message}
            </Alert>
          ) : null}

          {submissionMutation.data ? (
            <Paper sx={{ mt: 2, borderRadius: 3, p: 1.6, bgcolor: '#edf8f0', color: '#1b6f41' }}>
              <Typography sx={{ fontWeight: 700 }}>Score: {submissionMutation.data.score}%</Typography>
              <Typography sx={{ mt: 0.5 }}>Feedback: {submissionMutation.data.feedback}</Typography>
              {submissionMutation.data.recommendationImpact ? (
                <Typography sx={{ mt: 0.5, fontSize: 13 }}>
                  Recommendation impact: {submissionMutation.data.recommendationImpact}
                </Typography>
              ) : null}
            </Paper>
          ) : null}
        </CardContent>
      </Card>
    </Stack>
  )
}
