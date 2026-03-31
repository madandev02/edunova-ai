import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Skeleton, Snackbar, Stack, TextField, Typography } from '@mui/material'
import { Check } from 'lucide-react'
import { useDiscussionsQuery, useCreateDiscussionMutation, useDeleteDiscussionMutation, useUpdateDiscussionMutation } from '../features/courses/discussionsQueries'
import { EmptyState } from './states/EmptyState'
import { ErrorState } from './states/ErrorState'

interface CourseDiscussionsProps {
  courseId: string
}

export const CourseDiscussionsSection = ({ courseId }: CourseDiscussionsProps) => {
  const pageSize = 6
  const [newBody, setNewBody] = useState('')
  const [selectedKind, setSelectedKind] = useState<'question' | 'answer' | 'comment'>('question')
  const [page, setPage] = useState(0)
  const [toast, setToast] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: '',
  })

  const { data, isPending, isFetching, isError, error, refetch } = useDiscussionsQuery(courseId, {
    limit: pageSize,
    skip: page * pageSize,
  })
  const createDiscussion = useCreateDiscussionMutation(courseId)
  const deleteDiscussionMut = useDeleteDiscussionMutation(courseId)
  const updateDiscussionMut = useUpdateDiscussionMutation(courseId)

  const handleSubmitDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBody.trim()) {
      return
    }
    await createDiscussion.mutateAsync({ kind: selectedKind, body: newBody })
    setNewBody('')
    setSelectedKind('question')
    setToast({ open: true, severity: 'success', message: 'Discussion posted.' })
  }

  if (isPending) {
    return (
      <Stack spacing={1.4}>
        <Skeleton variant="text" width="35%" height={28} />
        <Skeleton variant="rounded" height={125} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={105} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={105} sx={{ borderRadius: 3 }} />
      </Stack>
    )
  }

  if (isError) {
    return <ErrorState message={error?.message || 'Failed to load discussions'} onRetry={() => void refetch()} />
  }

  const items = data?.items || []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Discussions ({data?.total ?? items.length})</Typography>
        {isFetching ? <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Refreshing...</Typography> : null}
      </Stack>

      <Box component="form" onSubmit={handleSubmitDiscussion} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="subtitle2">Start a discussion</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(['question', 'answer', 'comment'] as const).map((kind) => (
            <Chip
              key={kind}
              label={kind.charAt(0).toUpperCase() + kind.slice(1)}
              onClick={() => setSelectedKind(kind)}
              color={selectedKind === kind ? 'primary' : 'default'}
              variant={selectedKind === kind ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
        <TextField
          multiline
          rows={3}
          placeholder="Ask a question or share your thoughts..."
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          disabled={createDiscussion.isPending}
        />
        <Button variant="contained" onClick={handleSubmitDiscussion} disabled={!newBody.trim() || createDiscussion.isPending}>
          Post Discussion
        </Button>
        {createDiscussion.isError && <Alert severity="error">{(createDiscussion.error as Error)?.message}</Alert>}
      </Box>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {items.length === 0 ? (
          <EmptyState title="No discussions yet" description="Be the first to start a discussion!" />
        ) : (
          items.map((discussion) => (
            <Card key={discussion.id} sx={{ borderRadius: 3, position: 'relative' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip label={discussion.kind.toUpperCase()} size="small" variant="outlined" />
                      {discussion.accepted_answer && (
                        <Chip icon={<Check size={16} />} label="Accepted" size="small" sx={{ bgcolor: '#ebf7ef', color: '#1e7a4c' }} />
                      )}
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{new Date(discussion.created_at).toLocaleDateString()}</Typography>
                  </Stack>

                  <Typography>{discussion.body}</Typography>

                  <Stack direction="row" spacing={1}>
                    {discussion.kind === 'answer' && !discussion.accepted_answer && (
                      <Button
                        size="small"
                        onClick={() => void updateDiscussionMut.mutateAsync({
                          discussionId: discussion.id,
                          payload: { accepted_answer: true },
                        })}
                      >
                        Mark as accepted
                      </Button>
                    )}
                    <Button size="small" color="error" onClick={() => void deleteDiscussionMut.mutateAsync(discussion.id)}>
                      Delete
                    </Button>
                  </Stack>

                  {discussion.replies && discussion.replies.length > 0 && (
                    <Stack sx={{ mt: 1.5, ml: 2, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }} spacing={1}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {discussion.replies.length} replies
                      </Typography>
                      {discussion.replies.map((reply) => (
                        <Card key={reply.id} variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ py: 1, px: 1.5 }}>
                            <Stack spacing={0.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Chip label={reply.kind.toUpperCase()} size="small" variant="outlined" />
                                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{new Date(reply.created_at).toLocaleDateString()}</Typography>
                              </Stack>
                              <Typography sx={{ fontSize: 14 }}>{reply.body}</Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {data && data.total > pageSize ? (
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Page {page + 1} of {totalPages}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>
              Previous
            </Button>
            <Button size="small" variant="outlined" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </Stack>
        </Stack>
      ) : null}

      <Snackbar
        open={toast.open}
        autoHideDuration={2800}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((current) => ({ ...current, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
