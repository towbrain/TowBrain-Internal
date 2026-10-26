import type { ActivityLog, PipelineStage, Profile, ApprovalStatus } from '@/types/domain'
import { APPROVAL_STATUS_LABELS } from '@/types/domain'

const DELETED_USER_LABEL = 'a former team member'

export function actorName(actorId: string | null, profilesById: Map<string, Profile>): string {
  if (!actorId) return 'System'
  return profilesById.get(actorId)?.full_name ?? DELETED_USER_LABEL
}

function stageLabel(key: unknown, stagesByKey: Map<string, PipelineStage>): string {
  if (typeof key !== 'string') return 'Unknown'
  return stagesByKey.get(key)?.label ?? key
}

function userLabel(id: unknown, profilesById: Map<string, Profile>): string {
  if (!id || typeof id !== 'string') return 'Unassigned'
  return profilesById.get(id)?.full_name ?? DELETED_USER_LABEL
}

/** Builds the human-readable sentence shown in the activity timeline, e.g.
 * "Sarah changed status from New to Contacted." Never falls back to raw JSON. */
export function describeActivity(
  log: ActivityLog,
  profilesById: Map<string, Profile>,
  stagesByKey: Map<string, PipelineStage>,
): string {
  const actor = actorName(log.actor_id, profilesById)
  const n = log.new_values ?? {}
  const o = log.old_values ?? {}

  switch (log.action) {
    case 'lead_created':
      return `${actor} created this lead.`
    case 'lead_updated':
      return `${actor} updated the lead's details.`
    case 'status_changed':
      return `${actor} changed the stage from ${stageLabel(o.status, stagesByKey)} to ${stageLabel(n.status, stagesByKey)}.`
    case 'approval_status_changed': {
      const from = APPROVAL_STATUS_LABELS[o.approval_status as ApprovalStatus] ?? 'Unknown'
      const to = APPROVAL_STATUS_LABELS[n.approval_status as ApprovalStatus] ?? 'Unknown'
      return `${actor} changed approval status from ${from} to ${to}.`
    }
    case 'assignee_changed':
      return `${actor} reassigned this lead to ${userLabel(n.assigned_to, profilesById)}.`
    case 'note_added':
      return `${actor} added a note.`
    case 'contact_attempt_recorded':
      return `${actor} logged a contact attempt${n.contact_method ? ` via ${n.contact_method}` : ''}.`
    case 'lead_deleted':
      return `${actor} deleted this lead.`
    case 'lead_restored':
      return `${actor} restored this lead.`
    default:
      return `${actor} made a change.`
  }
}
