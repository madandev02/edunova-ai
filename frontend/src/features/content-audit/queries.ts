import { useMutation, useQuery } from '@tanstack/react-query'
import { apiService } from '../../services/api'
import { queryClient } from '../../services/queryClient'

export const useContentAuditQuery = () => {
  return useQuery({
    queryKey: ['content-audit'],
    queryFn: apiService.getContentAudit,
  })
}

export const useContentAuditDetailsQuery = () => {
  return useQuery({
    queryKey: ['content-audit', 'details'],
    queryFn: apiService.getContentAuditDetails,
  })
}

export const useContentAuditFixMutation = () => {
  return useMutation({
    mutationFn: (dryRun: boolean) => apiService.fixContentAudit(dryRun),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content-audit'] })
      void queryClient.invalidateQueries({ queryKey: ['content-audit', 'details'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
      void queryClient.invalidateQueries({ queryKey: ['course'] })
      void queryClient.invalidateQueries({ queryKey: ['lesson'] })
      void queryClient.invalidateQueries({ queryKey: ['learning-path'] })
      void queryClient.invalidateQueries({ queryKey: ['analytics'] })
      void queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}
