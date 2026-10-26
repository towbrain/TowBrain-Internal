import { supabase } from '@/lib/supabase'
import type { ApprovalStatus, Lead } from '@/types/domain'

export interface LeadInput {
  client_name: string
  company_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  google_maps_url: string | null
  source: string | null
  status: string
  approval_status: ApprovalStatus
  assigned_to: string | null
  follow_up_at: string | null
  tags: string[]
}

export async function createLead(input: LeadInput) {
  return supabase.from('leads').insert(input).select().single()
}

export type UpdateResult =
  | { ok: true; data: Lead }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; error: string }

/**
 * Updates a lead only if it hasn't changed since the editor loaded it (optimistic
 * concurrency via updated_at). Returns `conflict: true` instead of silently clobbering
 * a newer write made by another team member.
 */
export async function updateLead(
  id: string,
  patch: Partial<LeadInput>,
  expectedUpdatedAt: string,
): Promise<UpdateResult> {
  const { data, error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', id)
    .eq('updated_at', expectedUpdatedAt)
    .select()
    .maybeSingle()

  if (error) return { ok: false, conflict: false, error: error.message }
  if (!data) return { ok: false, conflict: true }
  return { ok: true, data }
}

/** Kanban drag: a lighter-weight status-only update with the same conflict check. */
export async function updateLeadStatus(id: string, status: string, expectedUpdatedAt: string) {
  return updateLead(id, { status }, expectedUpdatedAt)
}

export async function softDeleteLead(id: string) {
  return supabase.from('leads').update({ deleted_at: new Date().toISOString() }).eq('id', id)
}

export async function restoreLead(id: string) {
  return supabase.from('leads').update({ deleted_at: null }).eq('id', id)
}
