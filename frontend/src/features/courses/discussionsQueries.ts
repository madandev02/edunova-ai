import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../../services/api'

export const useDiscussionsQuery = (courseId: string | undefined, { limit = 10, skip = 0 } = {}) => {
  return useQuery({
    queryKey: ['discussions', courseId, { limit, skip }],
    queryFn: () => (courseId ? apiService.getDiscussions(courseId, { limit, skip }) : Promise.resolve({ items: [], total: 0 })),
    enabled: !!courseId,
    staleTime: 45_000,
    gcTime: 5 * 60_000,
    placeholderData: (previousData) => previousData,
  })
}

export const useCreateDiscussionMutation = (courseId: string | undefined) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { kind: 'question' | 'answer' | 'comment'; body: string; parent_id?: number }) =>
      courseId ? apiService.createDiscussion(courseId, payload) : Promise.reject(new Error('Course ID is required')),
    onSuccess: () => {
      if (courseId) {
        void queryClient.invalidateQueries({ queryKey: ['discussions', courseId] })
      }
    },
  })
}

export const useUpdateDiscussionMutation = (courseId: string | undefined) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ discussionId, payload }: { discussionId: number; payload: { body?: string; accepted_answer?: boolean } }) =>
      courseId ? apiService.updateDiscussion(courseId, discussionId, payload) : Promise.reject(new Error('Course ID is required')),
    onSuccess: () => {
      if (courseId) {
        void queryClient.invalidateQueries({ queryKey: ['discussions', courseId] })
      }
    },
  })
}

export const useDeleteDiscussionMutation = (courseId: string | undefined) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (discussionId: number) =>
      courseId ? apiService.deleteDiscussion(courseId, discussionId) : Promise.reject(new Error('Course ID is required')),
    onSuccess: () => {
      if (courseId) {
        void queryClient.invalidateQueries({ queryKey: ['discussions', courseId] })
      }
    },
  })
}
