import { CheckCircle2 } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { EmptyState } from '../components/states/EmptyState'
import { ErrorState } from '../components/states/ErrorState'
import { LoadingState } from '../components/states/LoadingState'
import { UpgradeRequiredState } from '../components/states/UpgradeRequiredState'
import { useCourseDetailQuery } from '../features/courses/queries'
import {
  useLessonQuery,
  useLessonSubmissionMutation,
  useLessonVideoProgressQuery,
  useMarkLessonCompleteMutation,
  useTranscriptNotesQuery,
  useUpsertLessonVideoProgressMutation,
  useUpsertTranscriptNotesMutation,
} from '../features/lesson/queries'
import { usePageTitle } from '../hooks/usePageTitle'
import { ApiError } from '../services/api'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const renderTranscriptWithHighlight = (text: string, phrase?: string | null): ReactNode => {
  const normalizedPhrase = phrase?.trim()
  if (!normalizedPhrase) {
    return text
  }

  const matcher = new RegExp(`(${escapeRegExp(normalizedPhrase)})`, 'ig')
  const parts = text.split(matcher)
  if (parts.length <= 1) {
    return text
  }

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedPhrase.toLowerCase() ? (
      <Box
        key={`${part}-${index}`}
        component="mark"
        sx={{ borderRadius: 0.7, bgcolor: 'rgba(251, 191, 36, 0.45)', px: 0.4, color: 'text.primary' }}
      >
        {part}
      </Box>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

export const LearnPage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [lessonStartedAt, setLessonStartedAt] = useState<number>(0)
  const [transcriptSearch, setTranscriptSearch] = useState('')
  const [activeTranscriptSegmentId, setActiveTranscriptSegmentId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [selectedHighlightPhrase, setSelectedHighlightPhrase] = useState('')
  const [highlightEnabled, setHighlightEnabled] = useState(true)
  const [localCompletedSections, setLocalCompletedSections] = useState<string[]>([])
  const [lastRestoredLessonId, setLastRestoredLessonId] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastVideoSyncRef = useRef(0)

  usePageTitle('Learning Workspace')

  const courseQuery = useCourseDetailQuery(courseId)
  const activeLessonId = selectedLessonId ?? courseQuery.data?.modules[0]?.lessons[0]?.id?.toString()
  const lessonQuery = useLessonQuery(activeLessonId)
  const videoProgressQuery = useLessonVideoProgressQuery(activeLessonId)
  const submitMutation = useLessonSubmissionMutation(activeLessonId)
  const transcriptNotesQuery = useTranscriptNotesQuery(activeLessonId)
  const completeMutation = useMarkLessonCompleteMutation(activeLessonId)
  const upsertVideoProgressMutation = useUpsertLessonVideoProgressMutation(activeLessonId)
  const upsertTranscriptNotesMutation = useUpsertTranscriptNotesMutation(activeLessonId)

  const remoteCompletedSections = videoProgressQuery.data?.completedSectionIds ?? []
  const completedSectionSet = new Set([...remoteCompletedSections, ...localCompletedSections])
  const transcriptSegments = lessonQuery.data?.transcriptSegments ?? []
  const filteredTranscript = transcriptSearch.trim().length
    ? transcriptSegments.filter((segment) =>
        segment.text.toLowerCase().includes(transcriptSearch.trim().toLowerCase()),
      )
    : transcriptSegments

  const transcriptNotesBySegment = new Map(
    (transcriptNotesQuery.data ?? []).map((note) => [note.segmentId, note]),
  )
  const isEmbeddedVideo = Boolean(lessonQuery.data?.videoUrl?.includes('youtube.com/embed'))

  if (!courseId) {
    return <EmptyState title="Course missing" description="Open a course to start learning." />
  }

  if (courseQuery.isPending) {
    return <LoadingState label="Preparing your learning workspace..." />
  }

  if (courseQuery.isError) {
    if (courseQuery.error instanceof ApiError && courseQuery.error.status === 402) {
      return (
        <UpgradeRequiredState
          title="Premium learning workspace"
          description="This course workspace is available on paid plans. Upgrade to unlock the full learning flow."
        />
      )
    }
    return <ErrorState message={courseQuery.error.message} onRetry={() => void courseQuery.refetch()} />
  }

  const submit = () => {
    if (!answer.trim()) {
      return
    }

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - lessonStartedAt) / 1000))
    submitMutation.mutate({ answer, time_spent_seconds: elapsedSeconds })
  }

  const jumpToSection = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds
      void videoRef.current.play()
    }
  }

  const saveVideoProgress = (playbackSeconds: number, completedSectionIds: string[]) => {
    if (!activeLessonId) {
      return
    }

    upsertVideoProgressMutation.mutate({
      playback_seconds: Math.max(0, playbackSeconds),
      completed_section_ids: completedSectionIds,
      video_duration_seconds: lessonQuery.data?.videoDurationSeconds,
    })
  }

  const onSectionCompleted = (sectionId: string, startSeconds: number) => {
    if (completedSectionSet.has(sectionId)) {
      jumpToSection(startSeconds)
      return
    }

    const merged = [...completedSectionSet, sectionId]
    setLocalCompletedSections((previous) => [...previous, sectionId])
    const playbackSeconds = Math.floor(videoRef.current?.currentTime ?? startSeconds)
    saveVideoProgress(playbackSeconds, merged)
    jumpToSection(startSeconds)
  }

  const saveTranscriptNote = () => {
    if (!activeTranscriptSegmentId) {
      return
    }

    const segment = transcriptSegments.find((item) => item.id === activeTranscriptSegmentId)
    if (!segment) {
      return
    }

    upsertTranscriptNotesMutation.mutate({
      notes: [
        {
          segment_id: activeTranscriptSegmentId,
          highlight_text: highlightEnabled && selectedHighlightPhrase.trim() ? selectedHighlightPhrase.trim() : null,
          note_text: noteDraft.trim() ? noteDraft.trim() : null,
        },
      ],
    })
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 1.4, md: 2 },
        gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          minHeight: { lg: '72vh' },
          maxHeight: { lg: 'calc(100vh - 132px)' },
          overflowY: { lg: 'auto' },
          position: { lg: 'sticky' },
          top: { lg: 88 },
          borderRadius: 4,
          p: { xs: 1.6, md: 2 },
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255, 250, 244, 0.82)',
        }}
      >
        <Typography variant="h6">{courseQuery.data.title}</Typography>
        <Typography sx={{ mt: 0.4, fontSize: 14, color: 'text.secondary' }}>Modules and lessons</Typography>

        <Stack spacing={2} sx={{ mt: 3 }}>
          {courseQuery.data.modules.map((module) => (
            <Box key={module.id}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                {module.title}
              </Typography>
              <Stack spacing={1} sx={{ mt: 1.2 }}>
                {module.lessons.map((lesson) => {
                  const isActive = activeLessonId === lesson.id.toString()
                  return (
                    <Button
                      key={lesson.id}
                      type="button"
                      variant={isActive ? 'contained' : 'outlined'}
                      onClick={() => {
                        setSelectedLessonId(lesson.id.toString())
                        setLessonStartedAt(Date.now())
                        setTranscriptSearch('')
                        setActiveTranscriptSegmentId(null)
                        setNoteDraft('')
                        setSelectedHighlightPhrase('')
                        setHighlightEnabled(true)
                        setLocalCompletedSections([])
                        setLastRestoredLessonId(null)
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1,
                        px: 1.5,
                        bgcolor: isActive ? 'primary.main' : 'transparent',
                        color: isActive ? 'primary.contrastText' : 'text.primary',
                        borderColor: isActive ? 'primary.main' : 'divider',
                      }}
                    >
                      #{lesson.order_index} {lesson.title}
                    </Button>
                  )
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Box component="main">
        <Stack spacing={2}>
          {lessonQuery.isPending ? <LoadingState label="Loading lesson..." /> : null}
          {lessonQuery.isError ? (
            lessonQuery.error instanceof ApiError && lessonQuery.error.status === 402 ? (
              <UpgradeRequiredState
                title="Lesson upgrade required"
                description="This lesson is part of paid content. Upgrade your plan to continue learning."
              />
            ) : (
              <ErrorState message={lessonQuery.error.message} onRetry={() => void lessonQuery.refetch()} />
            )
          ) : null}

          {lessonQuery.data ? (
            <Card sx={{ borderRadius: 4, p: { xs: 2, md: 3 }, bgcolor: 'rgba(255, 252, 247, 0.88)', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {lessonQuery.data.title}
              </Typography>
              <Typography sx={{ mt: 0.6, fontSize: 14, color: 'text.secondary' }}>
                Topic: {lessonQuery.data.topic}
              </Typography>

              <Paper
                variant="outlined"
                sx={{ mt: 2, borderRadius: 3, p: 2, bgcolor: 'rgba(229, 242, 255, 0.48)', borderColor: 'rgba(80, 122, 170, 0.28)' }}
              >
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary' }}>
                  Lesson goal
                </Typography>
                <Typography sx={{ mt: 0.8, fontSize: 14 }}>{lessonQuery.data.lessonGoal}</Typography>
              </Paper>

              {lessonQuery.data.keyConcepts.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary' }}>
                    Key concepts
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                    {lessonQuery.data.keyConcepts.map((concept) => (
                      <Chip key={concept} label={concept} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {lessonQuery.data.videoUrl ? (
                <Paper variant="outlined" sx={{ mt: 2.4, borderRadius: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.82)' }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Lesson video</Typography>
                  {isEmbeddedVideo ? (
                    <Box sx={{ mt: 1.5, overflow: 'hidden', borderRadius: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'black' }}>
                      <iframe
                        src={lessonQuery.data.videoUrl}
                        title={lessonQuery.data.title}
                        style={{ width: '100%', aspectRatio: '16 / 9', border: 0, display: 'block' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                  ) : (
                    <Box
                      component="video"
                      ref={videoRef}
                      controls
                      src={lessonQuery.data.videoUrl}
                      onLoadedMetadata={(event) => {
                        if (!activeLessonId || lastRestoredLessonId === activeLessonId) {
                          return
                        }

                        const target = Math.max(0, Math.floor(videoProgressQuery.data?.playbackSeconds ?? 0))
                        if (target > 0) {
                          event.currentTarget.currentTime = target
                        }
                        setLastRestoredLessonId(activeLessonId)
                      }}
                      onTimeUpdate={(event) => {
                        const nowSeconds = Math.floor(event.currentTarget.currentTime)
                        if (Math.abs(nowSeconds - lastVideoSyncRef.current) < 12) {
                          return
                        }

                        lastVideoSyncRef.current = nowSeconds
                        saveVideoProgress(nowSeconds, [...completedSectionSet])
                      }}
                      onPause={(event) => {
                        const nowSeconds = Math.floor(event.currentTarget.currentTime)
                        saveVideoProgress(nowSeconds, [...completedSectionSet])
                      }}
                      sx={{
                        mt: 1.5,
                        width: '100%',
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'black',
                      }}
                    />
                  )}

                  <Box sx={{ mt: 1.8, display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                    {(lessonQuery.data.videoSections ?? []).map((section) => (
                      <Paper
                        key={section.id}
                        variant="outlined"
                        sx={{
                          px: 1.2,
                          py: 0.9,
                          borderRadius: 2,
                          bgcolor: 'rgba(250, 247, 241, 0.72)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <Button
                          type="button"
                          size="small"
                          onClick={() => jumpToSection(section.startSeconds)}
                          sx={{
                            flex: 1,
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            color: 'text.primary',
                            fontSize: 12,
                            fontWeight: 600,
                            px: 0.6,
                          }}
                        >
                          {section.label} ({Math.floor(section.startSeconds / 60)}:{`${section.startSeconds % 60}`.padStart(2, '0')})
                        </Button>
                        <Button
                          type="button"
                          size="small"
                          variant={completedSectionSet.has(section.id) ? 'contained' : 'outlined'}
                          color={completedSectionSet.has(section.id) ? 'success' : 'inherit'}
                          onClick={() => onSectionCompleted(section.id, section.startSeconds)}
                          sx={{ textTransform: 'none', fontSize: 11, minWidth: 88 }}
                        >
                          {completedSectionSet.has(section.id) ? 'Done' : 'Mark done'}
                        </Button>
                      </Paper>
                    ))}
                  </Box>

                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 2,
                      borderRadius: 3,
                      p: 2,
                      bgcolor: 'rgba(248, 243, 236, 0.76)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Transcript</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Completion ratio {Math.round((videoProgressQuery.data?.completionRatio ?? 0) * 100)}%
                      </Typography>
                    </Stack>

                    <TextField
                      value={transcriptSearch}
                      onChange={(event) => setTranscriptSearch(event.target.value)}
                      placeholder="Search transcript..."
                      size="small"
                      fullWidth
                      sx={{ mt: 1.4 }}
                    />

                    <Stack spacing={1} sx={{ mt: 1.6, maxHeight: 224, overflow: 'auto', pr: 0.5 }}>
                      {filteredTranscript.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 1.4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.78)' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            No transcript segments match your search.
                          </Typography>
                        </Paper>
                      ) : (
                        filteredTranscript.map((segment) => {
                          const minute = Math.floor(segment.startSeconds / 60)
                          const second = `${segment.startSeconds % 60}`.padStart(2, '0')

                          const existingNote = transcriptNotesBySegment.get(segment.id)
                          const previewPhrase =
                            activeTranscriptSegmentId === segment.id && highlightEnabled
                              ? selectedHighlightPhrase
                              : existingNote?.highlightText

                          return (
                            <Paper
                              key={segment.id}
                              variant="outlined"
                              sx={{
                                p: 1.3,
                                borderRadius: 2,
                                borderColor:
                                  activeTranscriptSegmentId === segment.id ? 'primary.main' : 'divider',
                                bgcolor:
                                  activeTranscriptSegmentId === segment.id
                                    ? 'rgba(236, 247, 255, 0.9)'
                                    : 'rgba(255,255,255,0.88)',
                              }}
                            >
                              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                  [{minute}:{second}]
                                </Typography>
                                <Button
                                  type="button"
                                  size="small"
                                  variant="outlined"
                                  onClick={() => jumpToSection(segment.startSeconds)}
                                  sx={{ textTransform: 'none', fontSize: 11, minWidth: 64 }}
                                >
                                  Jump
                                </Button>
                              </Stack>
                              <Button
                                type="button"
                                onClick={() => {
                                  setActiveTranscriptSegmentId(segment.id)
                                  setNoteDraft(existingNote?.noteText ?? '')
                                  setSelectedHighlightPhrase(existingNote?.highlightText ?? '')
                                  setHighlightEnabled(Boolean(existingNote?.highlightText))
                                }}
                                sx={{
                                  mt: 0.5,
                                  p: 0,
                                  textTransform: 'none',
                                  justifyContent: 'flex-start',
                                  color: 'text.primary',
                                  fontSize: 12,
                                  textAlign: 'left',
                                  width: '100%',
                                }}
                              >
                                <Typography
                                  component="span"
                                  sx={{ userSelect: 'text', color: 'text.primary', fontSize: 12, lineHeight: 1.5 }}
                                  onMouseUp={() => {
                                    const selection = window.getSelection()?.toString().trim() ?? ''
                                    if (!selection) {
                                      return
                                    }
                                    if (!segment.text.toLowerCase().includes(selection.toLowerCase())) {
                                      return
                                    }

                                    setActiveTranscriptSegmentId(segment.id)
                                    setHighlightEnabled(true)
                                    setSelectedHighlightPhrase(selection.slice(0, 180))
                                  }}
                                >
                                  {renderTranscriptWithHighlight(segment.text, previewPhrase)}
                                </Typography>
                              </Button>
                              {existingNote ? (
                                <Typography sx={{ mt: 0.5, fontSize: 11, fontWeight: 600, color: 'success.main' }}>
                                  Saved note/highlight
                                </Typography>
                              ) : null}
                            </Paper>
                          )
                        })
                      )}
                    </Stack>

                    {activeTranscriptSegmentId ? (
                      <Paper variant="outlined" sx={{ mt: 1.6, borderRadius: 2.4, p: 1.6, bgcolor: 'rgba(255,255,255,0.9)' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary' }}>
                            Segment notes
                          </Typography>
                          <FormControlLabel
                            sx={{ mr: 0 }}
                            control={
                              <Checkbox
                                size="small"
                                checked={highlightEnabled}
                                onChange={(event) => setHighlightEnabled(event.target.checked)}
                              />
                            }
                            label={<Typography variant="caption">Save highlight</Typography>}
                          />
                        </Stack>
                        <Paper
                          variant="outlined"
                          sx={{ mt: 1, borderRadius: 2, p: 1, bgcolor: 'rgba(248, 243, 236, 0.76)' }}
                        >
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Selected phrase:{' '}
                            <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>
                              {selectedHighlightPhrase || 'Select text directly in the transcript line to set phrase highlight.'}
                            </Box>
                          </Typography>
                        </Paper>
                        <TextField
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          rows={3}
                          multiline
                          placeholder="Write a personal note for this transcript segment..."
                          fullWidth
                          size="small"
                          sx={{ mt: 1.2 }}
                        />
                        <Button
                          type="button"
                          onClick={saveTranscriptNote}
                          disabled={upsertTranscriptNotesMutation.isPending}
                          variant="contained"
                          size="small"
                          sx={{ mt: 1.2, textTransform: 'none' }}
                        >
                          {upsertTranscriptNotesMutation.isPending ? 'Saving...' : 'Save note'}
                        </Button>
                      </Paper>
                    ) : null}

                    <Paper
                      variant="outlined"
                      sx={{
                        mt: 1.6,
                        borderRadius: 2,
                        px: 1.4,
                        py: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.8,
                        borderColor: 'success.light',
                        bgcolor: 'rgba(240, 253, 246, 0.95)',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 600 }}>
                        Section markers feed analytics and recommendation signals. Keep completing them for more accurate recommendations.
                      </Typography>
                    </Paper>
                  </Paper>
                </Paper>
              ) : null}

              <Stack spacing={{ xs: 1, md: 1.4 }} sx={{ mt: 2.2 }}>
                {lessonQuery.data.content.map((block) => (
                  <Paper key={block.id} variant="outlined" sx={{ borderRadius: 2.5, p: 2, bgcolor: 'rgba(255,255,255,0.82)' }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{block.title}</Typography>
                    <Typography sx={{ mt: 1, fontSize: 14, lineHeight: 1.85, color: 'text.secondary' }}>{block.body}</Typography>
                  </Paper>
                ))}
              </Stack>

              {lessonQuery.data.quizQuestion ? (
                <Paper
                  variant="outlined"
                  sx={{ mt: 2.2, borderRadius: 3, p: 2, borderColor: 'rgba(80, 122, 170, 0.32)', bgcolor: 'rgba(229, 242, 255, 0.44)' }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{lessonQuery.data.quizQuestion}</Typography>
                  <TextField
                    value={answer}
                    onFocus={() => {
                      if (lessonStartedAt === 0) {
                        setLessonStartedAt(Date.now())
                      }
                    }}
                    onChange={(event) => {
                      if (lessonStartedAt === 0) {
                        setLessonStartedAt(Date.now())
                      }
                      setAnswer(event.target.value)
                    }}
                    rows={3}
                    multiline
                    fullWidth
                    placeholder="Type your answer"
                    sx={{ mt: 1.3 }}
                  />
                  <Button
                    type="button"
                    onClick={submit}
                    disabled={submitMutation.isPending}
                    variant="contained"
                    sx={{ mt: 1.3, textTransform: 'none' }}
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit answer'}
                  </Button>

                  {submitMutation.data ? (
                    <Stack spacing={0.4} sx={{ mt: 1.3 }}>
                      <Typography sx={{ fontSize: 14, color: 'success.dark' }}>
                        Score {submitMutation.data.score}% - {submitMutation.data.feedback}
                      </Typography>
                      {submitMutation.data.xpGained ? (
                        <Typography sx={{ fontSize: 14, color: 'success.dark' }}>XP gained: +{submitMutation.data.xpGained}</Typography>
                      ) : null}
                      {submitMutation.data.streakDays ? (
                        <Typography sx={{ fontSize: 14, color: 'success.dark' }}>Current streak: {submitMutation.data.streakDays} days</Typography>
                      ) : null}
                    </Stack>
                  ) : null}
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ mt: 2.2, borderRadius: 3, p: 2, bgcolor: 'rgba(248, 243, 236, 0.76)' }}>
                  <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
                    This lesson has no quiz yet. Complete it now to unlock personalized recommendations.
                  </Typography>
                </Paper>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.2} sx={{ mt: 2 }}>
                <Button
                  type="button"
                  onClick={() => completeMutation.mutate()}
                  disabled={completeMutation.isPending}
                  variant="outlined"
                  color="success"
                  sx={{ textTransform: 'none' }}
                >
                  {completeMutation.isPending ? 'Updating...' : 'Mark as complete'}
                </Button>
                {completeMutation.data ? (
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'success.dark' }}>
                    Lesson completed and recommendations updated.
                  </Typography>
                ) : null}
              </Stack>
            </Card>
          ) : null}
        </Stack>
      </Box>
    </Box>
  )
}
