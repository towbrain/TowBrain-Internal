import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signUpSchema, type SignUpValues } from '@/schemas/authSchema'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignUpPage() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmEmailSent, setConfirmEmailSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) })

  if (!authLoading && session) return <Navigate to="/overview" replace />

  async function onSubmit(values: SignUpValues) {
    setFormError(null)
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName } },
    })
    if (error) {
      setFormError(
        error.message.toLowerCase().includes('already registered')
          ? 'An account with that email already exists.'
          : error.message,
      )
      return
    }
    if (data.session) {
      navigate('/overview')
      return
    }
    setConfirmEmailSent(true)
  }

  if (confirmEmailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="mb-1 text-lg font-semibold text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link. Click it, then come back and sign in.
          </p>
          <Link to="/login" className="mt-4 block text-sm text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-foreground">Create an account</h1>
        <p className="mb-5 text-sm text-muted-foreground">Internal CRM — team access only.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" type="text" autoComplete="name" {...register('fullName')} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <Link to="/login" className="mt-4 block text-center text-sm text-primary hover:underline">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  )
}
