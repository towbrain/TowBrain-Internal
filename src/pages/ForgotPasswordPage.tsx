import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/schemas/authSchema'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(values: ForgotPasswordValues) {
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // Always show success, whether or not the email exists, so this can't be used to probe accounts.
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-foreground">Reset password</h1>
        {sent ? (
          <p className="text-sm text-muted-foreground">
            If that email has an account, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <>
            <p className="mb-5 text-sm text-muted-foreground">We'll email you a link to set a new password.</p>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          </>
        )}
        <Link to="/login" className="mt-4 block text-center text-sm text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
