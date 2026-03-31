import { useMutation } from '@tanstack/react-query'
import type { AssistantRequest } from '../../types/api'
import { apiService } from '../../services/api'

export const useAssistantMutation = () => {
  return useMutation({
    mutationFn: (payload: AssistantRequest) => apiService.askAssistant(payload),
    retry: 1,
  })
}
