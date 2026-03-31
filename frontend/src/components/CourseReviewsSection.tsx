import { useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Rating, Skeleton, Snackbar, Stack, TextField, Typography } from '@mui/material'
import { useReviewsQuery, useCreateReviewMutation, useDeleteReviewMutation } from '../features/courses/reviewsQueries'
import { EmptyState } from './states/EmptyState'
import { ErrorState } from './states/ErrorState'

interface CourseReviewsSectionProps {
  courseId: string
}

export const CourseReviewsSection = ({ courseId }: CourseReviewsSectionProps) => {
  const pageSize = 5
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [page, setPage] = useState(0)
  const [toast, setToast] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: '',
  })

  const { data, isPending, isFetching, isError, error, refetch } = useReviewsQuery(courseId, {
    limit: pageSize,
    skip: page * pageSize,
  })
  const createReview = useCreateReviewMutation(courseId)
  const deleteReviewMut = useDeleteReviewMutation(courseId)

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newRating === 0) {
      return
    }
    await createReview.mutateAsync({ rating: newRating, comment: newComment })
    setNewRating(0)
    setNewComment('')
    setToast({ open: true, severity: 'success', message: 'Review submitted.' })
  }

  const handleDeleteReview = async (reviewId: number) => {
    await deleteReviewMut.mutateAsync(reviewId)
    setToast({ open: true, severity: 'success', message: 'Review deleted.' })
  }

  if (isPending) {
    return (
      <Stack spacing={1.4}>
        <Skeleton variant="text" width="30%" height={30} />
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={95} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={95} sx={{ borderRadius: 3 }} />
      </Stack>
    )
  }

  if (isError) {
    return <ErrorState message={error?.message || 'Failed to load reviews'} onRetry={() => void refetch()} />
  }

  const stats = data?.stats || { total_reviews: 0, average_rating: 0 }
  const items = data?.items || []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Reviews ({stats.total_reviews})</Typography>
        {isFetching ? <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Refreshing...</Typography> : null}
      </Stack>

      {stats.total_reviews > 0 && (
        <Card sx={{ borderRadius: 3, bgcolor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-start">
              <Typography variant="h4">{stats.average_rating.toFixed(1)}</Typography>
              <Stack>
                <Rating value={stats.average_rating} readOnly />
                <Typography sx={{ fontSize: 12 }}>{stats.total_reviews} reviews</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Box component="form" onSubmit={handleSubmitReview} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="subtitle2">Write a review</Typography>
        <Rating value={newRating} onChange={(_, value) => setNewRating(value || 0)} />
        <TextField
          multiline
          rows={3}
          placeholder="Share your experience with this course..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={createReview.isPending}
        />
        <Button variant="contained" onClick={handleSubmitReview} disabled={newRating === 0 || createReview.isPending}>
          Submit Review
        </Button>
        {createReview.isError && <Alert severity="error">{(createReview.error as Error)?.message}</Alert>}
      </Box>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {items.length === 0 ? (
          <EmptyState title="No reviews yet" description="Be the first to review this course!" />
        ) : (
          items.map((review) => (
            <Card key={review.id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Rating value={review.rating} readOnly size="small" />
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{new Date(review.created_at).toLocaleDateString()}</Typography>
                    </Stack>
                    <Typography>{review.comment}</Typography>
                  </Stack>
                  <Button size="small" color="error" onClick={() => handleDeleteReview(review.id)}>
                    Delete
                  </Button>
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
