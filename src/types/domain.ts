export type UserRole = 'admin' | 'member'

export type ApprovalStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected'

export type NoteKind = 'note' | 'contact_attempt'

export type ActivityAction =
  | 'lead_created'
  | 'lead_updated'
  | 'status_changed'
  | 'approval_status_changed'
  | 'assignee_changed'
  | 'note_added'
  | 'contact_attempt_recorded'
  | 'lead_deleted'
  | 'lead_restored'

export interface UserPreferences {
  defaultLandingPage?: '/overview' | '/leads' | '/pipeline'
  defaultStatusFilter?: string
  dateFormat?: 'relative' | 'absolute'
  theme?: 'light' | 'dark' | 'system'
}

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  key: string
  label: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Lead {
  id: string
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
  tags: string[]
  follow_up_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  last_edited_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

export interface LeadNote {
  id: string
  lead_id: string
  author_id: string
  kind: NoteKind
  note_text: string
  contact_method: string | null
  contact_outcome: string | null
  next_follow_up_at: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  lead_id: string
  actor_id: string | null
  action: ActivityAction
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  details: string | null
  created_at: string
}

export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Cold Call',
  'Social Media',
  'Advertisement',
  'Event',
  'Other',
] as const

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  not_submitted: 'Not Submitted',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const CONTACT_METHODS = ['Phone', 'Email', 'In Person', 'Video Call', 'Other'] as const

export const NOTE_TEMPLATES = [
  'Called client',
  'No answer',
  'Email sent',
  'Follow-up required',
  'Client interested',
  'Client declined',
] as const
