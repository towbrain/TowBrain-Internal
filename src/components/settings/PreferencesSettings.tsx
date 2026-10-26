import { toast } from 'sonner'
import { useAuth } from '@/auth/useAuth'
import { updatePreferences } from '@/lib/settingsApi'
import { applyTheme } from '@/hooks/useTheme'
import { usePipelineStages } from '@/hooks/usePipelineStages'
import { Label } from '@/components/ui/label'
import type { UserPreferences } from '@/types/domain'

const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm'

export function PreferencesSettings() {
  const { profile, session } = useAuth()
  const { activeStages } = usePipelineStages()

  if (!profile || !session) return null

  async function save(patch: Partial<UserPreferences>) {
    const next = { ...profile!.preferences, ...patch }
    const { error } = await updatePreferences(profile!.id, next)
    if (error) toast.error(error.message)
    else if (patch.theme) applyTheme(patch.theme)
  }

  return (
    <div className="max-w-md space-y-5">
      <div className="space-y-1.5">
        <Label>Default landing page</Label>
        <select
          className={selectClass}
          value={profile.preferences.defaultLandingPage ?? '/overview'}
          onChange={(e) => save({ defaultLandingPage: e.target.value as UserPreferences['defaultLandingPage'] })}
        >
          <option value="/overview">Overview</option>
          <option value="/leads">Leads</option>
          <option value="/pipeline">Pipeline</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Default pipeline stage filter</Label>
        <select
          className={selectClass}
          value={profile.preferences.defaultStatusFilter ?? 'all'}
          onChange={(e) => save({ defaultStatusFilter: e.target.value })}
        >
          <option value="all">All stages</option>
          {activeStages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Date display</Label>
        <select
          className={selectClass}
          value={profile.preferences.dateFormat ?? 'relative'}
          onChange={(e) => save({ dateFormat: e.target.value as UserPreferences['dateFormat'] })}
        >
          <option value="relative">Relative ("2 hours ago")</option>
          <option value="absolute">Absolute date</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Theme</Label>
        <select
          className={selectClass}
          value={profile.preferences.theme ?? 'system'}
          onChange={(e) => save({ theme: e.target.value as UserPreferences['theme'] })}
        >
          <option value="system">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  )
}
