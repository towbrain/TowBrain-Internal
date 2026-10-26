import { use } from 'react'
import { AuthContext } from '@/auth/AuthProvider'

export function useAuth() {
  return use(AuthContext)
}
