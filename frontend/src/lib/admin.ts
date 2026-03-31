import type { AuthUser } from '../types/api'

const ADMIN_EMAILS = ['demo@edunova.ai']

export const isAdminUser = (user: Pick<AuthUser, 'role' | 'email'> | null | undefined) => {
  if (!user) {
    return false
  }

  if (user.role === 'admin') {
    return true
  }

  return ADMIN_EMAILS.includes(user.email.toLowerCase())
}