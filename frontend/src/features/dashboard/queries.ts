import { useQuery } from '@tanstack/react-query'
import { apiService } from '../../services/api'

export const useDashboardQuery = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: apiService.getDashboard,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
}
