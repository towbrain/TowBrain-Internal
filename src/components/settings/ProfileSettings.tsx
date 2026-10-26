import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { supabase } from '@/lib/supabase'
import { updateProfile } from '@/lib/settingsApi'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ProfileSettings() {
  const { profile, session } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)

  if (!profile || !session) return null

  async function handleSave() {
    setSaving(true)
    const { error } = await updateProfile(profile!.id, { full_name: fullName.trim() })
    setSaving(false)
    if (error) toast.error(error.message)
    else toast.success('Profile updated')
  }

  async function handlePasswordReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(session!.user.email!, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) toast.error(error.message)
    else toast.success('Password reset email sent')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-md space-y-5">
      <div className="flex items-center gap-3">
        <Avatar name={profile.full_name} src={profile.avatar_url} className="size-14 text-lg" />
        <div>
          <p className="font-medium text-foreground">{profile.full_name}</p>
          <p className="text-sm capitalize text-muted-foreground">{profile.role}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Display name</Label>
        <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={session.user.email ?? ''} disabled />
      </div>

      <Button onClick={handleSave} disabled={saving || !fullName.trim()}>
        {saving ? 'Saving…' : 'Save changes'}
      </Button>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={handlePasswordReset}>
          Reset password
        </Button>
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
