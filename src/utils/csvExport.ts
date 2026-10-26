import type { Lead, Profile, PipelineStage } from '@/types/domain'

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function leadsToCsv(
  leads: Lead[],
  profilesById: Map<string, Profile>,
  stagesByKey: Map<string, PipelineStage>,
): string {
  const headers = [
    'Client Name',
    'Company',
    'Email',
    'Phone',
    'Website',
    'Source',
    'Stage',
    'Approval Status',
    'Assigned To',
    'Follow-up',
    'Created By',
    'Created At',
    'Updated At',
  ]
  const rows = leads.map((lead) => [
    lead.client_name,
    lead.company_name,
    lead.email,
    lead.phone,
    lead.website,
    lead.source,
    stagesByKey.get(lead.status)?.label ?? lead.status,
    lead.approval_status,
    lead.assigned_to ? profilesById.get(lead.assigned_to)?.full_name ?? 'Unknown' : '',
    lead.follow_up_at,
    profilesById.get(lead.created_by)?.full_name ?? 'Unknown',
    lead.created_at,
    lead.updated_at,
  ])
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
