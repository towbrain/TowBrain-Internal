import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/auth/AuthProvider'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuth } from '@/auth/useAuth'
import { supabaseConfigError } from '@/lib/supabase'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { PipelinePage } from '@/pages/PipelinePage'
import { SettingsPage } from '@/pages/SettingsPage'

function RootRedirect() {
  const { profile } = useAuth()
  return <Navigate to={profile?.preferences.defaultLandingPage ?? '/overview'} replace />
}

function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <p className="font-medium text-foreground">Configuration needed</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export default function App() {
  if (supabaseConfigError) {
    return <ConfigErrorScreen message={supabaseConfigError} />
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />
            <Route path="/overview" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
            <Route path="/pipeline" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}
