import { supabase } from '@/lib/supabase'
import type { UserPreferences, UserRole } from '@/types/domain'

export async function updateProfile(id: string, patch: { full_name?: string; avatar_url?: string | null }) {
  return supabase.from('profiles').update(patch).eq('id', id)
}

export async function updatePreferences(id: string, preferences: UserPreferences) {
  return supabase.from('profiles').update({ preferences }).eq('id', id)
}

/** Admin-only: enforced again server-side by the profiles RLS policy + touch_profiles trigger. */
export async function setMemberRole(id: string, role: UserRole) {
  return supabase.from('profiles').update({ role }).eq('id', id)
}

export async function setMemberActive(id: string, is_active: boolean) {
  return supabase.from('profiles').update({ is_active }).eq('id', id)
}

export interface PipelineStageInput {
  key: string
  label: string
  color: string
  sort_order: number
}

export async function createPipelineStage(input: PipelineStageInput) {
  return supabase.from('pipeline_stages').insert(input).select().single()
}

export async function updatePipelineStage(
  key: string,
  patch: Partial<Pick<PipelineStageInput, 'label' | 'color' | 'sort_order'>> & { is_active?: boolean },
) {
  return supabase.from('pipeline_stages').update(patch).eq('key', key)
}
