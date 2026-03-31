import { useQuery } from '@tanstack/react-query'
import { apiService } from '../../services/api'

export const useLearningPathQuery = () => {
  return useQuery({
    queryKey: ['learning-path'],
    queryFn: apiService.getLearningPath,
  })
}
