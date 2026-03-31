import { useQuery } from '@tanstack/react-query'
import { apiService } from '../../services/api'

export const useAnalyticsQuery = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: apiService.getAnalytics,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
}
