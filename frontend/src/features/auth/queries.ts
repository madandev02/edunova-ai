import { useMutation, useQuery } from '@tanstack/react-query'
import type { OnboardingRequest } from '../../types/api'
import { apiService } from '../../services/api'

export const useCurrentUserQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: apiService.me,
    enabled,
  })
}

export const useOnboardingStatusQuery = (enabled: boolean) => {
  return useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: apiService.getOnboardingStatus,
    enabled,
  })
}

export const useOnboardingCompleteMutation = () => {
  return useMutation({
    mutationFn: (payload: OnboardingRequest) => apiService.completeOnboarding(payload),
  })
}
