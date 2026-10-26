import { toast } from 'sonner'
import { useAuth } from '@/auth/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import { setMemberRole, setMemberActive } from '@/lib/settingsApi'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/utils/dateHelpers'

export function TeamSettings() {
  const { profile: me } = useAuth()
  const { profiles, loading, refresh } = useProfiles()
  const isAdmin = me?.role === 'admin'

  async function handleRoleToggle(id: string, currentRole: 'admin' | 'member') {
    const { error } = await setMemberRole(id, currentRole === 'admin' ? 'member' : 'admin')
    if (error) toast.error(error.message)
    else {
      toast.success('Role updated')
      refresh()
    }
  }

  async function handleActiveToggle(id: string, currentActive: boolean) {
    const { error } = await setMemberActive(id, !currentActive)
    if (error) toast.error(error.message)
    else {
      toast.success(currentActive ? 'Member deactivated' : 'Member reactivated')
      refresh()
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading team…</p>

  return (
    <div className="max-w-2xl space-y-4">
      <ul className="divide-y divide-border rounded-md border border-border">
        {profiles.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <Avatar name={p.full_name} src={p.avatar_url} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {p.full_name} {p.id === me?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">Joined {formatDate(p.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                {p.role}
              </Badge>
              <Badge variant={p.is_active ? 'success' : 'destructive'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
              {isAdmin && p.id !== me?.id && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleRoleToggle(p.id, p.role)}>
                    Make {p.role === 'admin' ? 'member' : 'admin'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleActiveToggle(p.id, p.is_active)}>
                    {p.is_active ? 'Deactivate' : 'Reactivate'}
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {isAdmin && (
        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Inviting a new team member</p>
          <p className="mt-1">
            New accounts must be created from the Supabase Dashboard (Authentication → Users → Add user), not from
            this app — the browser never has permission to create accounts directly. After creating the account,
            they'll appear here automatically as a <span className="font-medium">member</span>; promote them to
            admin if needed. See the README's "Creating the other two users" section for the exact steps.
          </p>
        </div>
      )}
    </div>
  )
}
