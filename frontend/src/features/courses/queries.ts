import { useQuery } from '@tanstack/react-query'
import { apiService } from '../../services/api'

export const useCoursesQuery = (filters: { category?: string; difficulty?: string; search?: string }) => {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => apiService.getCourses(filters),
  })
}

export const useCourseDetailQuery = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => apiService.getCourseDetail(courseId as string),
    enabled: Boolean(courseId),
  })
}
