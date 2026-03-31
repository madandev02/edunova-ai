import { useMutation } from '@tanstack/react-query'
import type { LoginRequest, RegisterRequest } from '../../types/api'
import { apiService } from '../../services/api'

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (payload: LoginRequest) => apiService.login(payload),
  })
}

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => apiService.register(payload),
  })
}
