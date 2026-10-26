import { supabase } from '@/lib/supabase'
import type { NoteKind } from '@/types/domain'

export interface NoteInput {
  lead_id: string
  kind: NoteKind
  note_text: string
  contact_method?: string | null
  contact_outcome?: string | null
  next_follow_up_at?: string | null
}

export async function addLeadNote(input: NoteInput) {
  return supabase.from('lead_notes').insert(input).select().single()
}
