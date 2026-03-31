import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../../services/api'

export const useReviewsQuery = (courseId: string | undefined, { limit = 10, skip = 0 } = {}) => {
  return useQuery({
    queryKey: ['reviews', courseId, { limit, skip }],
    queryFn: () => (courseId ? apiService.getReviews(courseId, { limit, skip }) : Promise.resolve({ items: [], total: 0, stats: { total_reviews: 0, average_rating: 0 } })),
    enabled: !!courseId,
    staleTime: 45_000,
    gcTime: 5 * 60_000,
    placeholderData: (previousData) => previousData,
  })
}

export const useCreateReviewMutation = (courseId: string | undefined) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { rating: number; comment: string }) =>
      courseId ? apiService.createReview(courseId, payload) : Promise.reject(new Error('Course ID is required')),
    onSuccess: () => {
      if (courseId) {
        void queryClient.invalidateQueries({ queryKey: ['reviews', courseId] })
      }
    },
  })
}

export const useUpdateReviewMutation = (courseId: string | undefined, reviewId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { rating?: number; comment?: string }) =>
      courseId ? apiService.updateReview(courseId, reviewId, payload) : Promise.reject(new Error('Course ID is required')),
    onSuccess: () => {
      if (courseId) {
        void queryClient.invalidateQueries({ queryKey: ['reviews', courseId] })
      }
    },
  })
}

export const useDeleteReviewMutation = (courseId: string | undefined) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reviewId: number) =>
      courseId ? apiService.deleteReview(courseId, reviewId) : Promise.reject(new Error('Course ID is required')),
    onSuccess: () => {
      if (courseId) {
        void queryClient.invalidateQueries({ queryKey: ['reviews', courseId] })
      }
    },
  })
}
