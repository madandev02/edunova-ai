import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiService, apiServiceRaw } from '../../services/api'

export const useInstructorCoursesQuery = () => {
  return useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () => apiService.getInstructorCourses(),
    staleTime: 60_000,
  })
}

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      title: string
      description: string
      category: string
      difficulty: string
      is_premium?: boolean
      thumbnail_url?: string | null
    }) => apiService.createInstructorCourse(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: string; payload: Record<string, unknown> }) =>
      apiService.updateInstructorCourse(courseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (courseId: string) => apiService.deleteInstructorCourse(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}

export const useCreateModuleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { courseId: string; title: string }) => {
      const { data } = await apiServiceRaw.post(`/instructor/courses/${payload.courseId}/modules`, {
        title: payload.title,
      })
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    },
  })
}

export const useUpdateModuleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ moduleId, payload }: { moduleId: number; payload: Record<string, unknown> }) => {
      const { data } = await apiServiceRaw.put(`/instructor/modules/${moduleId}`, payload)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    },
  })
}

export const useDeleteModuleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (moduleId: number) => {
      const { data } = await apiServiceRaw.delete(`/instructor/modules/${moduleId}`)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    },
  })
}

export const useCreateLessonMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ moduleId, payload }: { moduleId: number; payload: Record<string, unknown> }) => {
      const { data } = await apiServiceRaw.post(`/instructor/modules/${moduleId}/lessons`, payload)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    },
  })
}

export const useUpdateLessonMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ lessonId, payload }: { lessonId: number; payload: Record<string, unknown> }) => {
      const { data } = await apiServiceRaw.put(`/instructor/lessons/${lessonId}`, payload)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    },
  })
}

export const useDeleteLessonMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (lessonId: number) => {
      const { data } = await apiServiceRaw.delete(`/instructor/lessons/${lessonId}`)
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor-courses'] })
    },
  })
}
