import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Spinner } from '@/components/ui/spinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-medium text-foreground">Couldn't load your profile</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (profile && !profile.is_active) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-medium text-foreground">Your account is deactivated</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact a workspace administrator to restore access.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
