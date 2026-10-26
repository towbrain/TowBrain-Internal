import { useState, type ReactNode } from 'react'
import { Mail, Phone, Globe, MapPin, Building2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LeadFormDialog } from '@/components/leads/LeadFormDialog'
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog'
import { AddNoteForm } from '@/components/notes/AddNoteForm'
import { NotesList } from '@/components/notes/NotesList'
import { ActivityTimeline } from '@/components/activity/ActivityTimeline'
import { useProfiles } from '@/hooks/useProfiles'
import { usePipelineStages } from '@/hooks/usePipelineStages'
import { useAuth } from '@/auth/useAuth'
import { updateLead, restoreLead } from '@/lib/leadsApi'
import { formatDateTime } from '@/utils/dateHelpers'
import { APPROVAL_STATUS_LABELS, type Lead } from '@/types/domain'

export function LeadDetailDialog({ lead, trigger, onChanged }: { lead: Lead; trigger: ReactNode; onChanged?: () => void }) {
  const [open, setOpen] = useState(false)
  const { profiles, profilesById } = useProfiles()
  const { stages, stagesByKey } = usePipelineStages()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  async function handleFollowUpRecorded(iso: string) {
    const result = await updateLead(lead.id, { follow_up_at: iso }, lead.updated_at)
    if (!result.ok && result.conflict) {
      toast.error('Lead changed elsewhere — follow-up date on the lead itself was not updated.')
    }
  }

  async function handleRestore() {
    const { error } = await restoreLead(lead.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Lead restored')
      onChanged?.()
    }
  }

  const stage = stagesByKey.get(lead.status)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>{lead.client_name}</DialogTitle>
              {lead.company_name && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="size-3.5" /> {lead.company_name}
                </p>
              )}
            </div>
            <div className="flex gap-1.5">
              {lead.deleted_at ? (
                isAdmin && (
                  <Button size="sm" variant="outline" onClick={handleRestore}>
                    Restore
                  </Button>
                )
              ) : (
                <>
                  <LeadFormDialog
                    lead={lead}
                    profiles={profiles}
                    stages={stages}
                    onSaved={() => onChanged?.()}
                    trigger={
                      <Button size="sm" variant="outline">
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                    }
                  />
                  <DeleteLeadDialog
                    lead={lead}
                    onDeleted={() => {
                      setOpen(false)
                      onChanged?.()
                    }}
                    trigger={
                      <Button size="sm" variant="outline">
                        Delete
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-sm">
          <Badge style={{ backgroundColor: stage?.color, color: 'white', border: 'none' }}>
            {stage?.label ?? lead.status}
          </Badge>
          <Badge variant="outline">{APPROVAL_STATUS_LABELS[lead.approval_status]}</Badge>
          {lead.deleted_at && <Badge variant="destructive">Deleted</Badge>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-foreground hover:underline">
              <Mail className="size-4 text-muted-foreground" /> {lead.email}
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-foreground hover:underline">
              <Phone className="size-4 text-muted-foreground" /> {lead.phone}
            </a>
          )}
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-foreground hover:underline"
            >
              <Globe className="size-4 text-muted-foreground" /> {lead.website}
            </a>
          )}
          {lead.google_maps_url && (
            <a
              href={lead.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-foreground hover:underline"
            >
              <MapPin className="size-4 text-muted-foreground" /> Google Maps
            </a>
          )}
          <div className="text-muted-foreground">
            Assigned to <span className="text-foreground">{lead.assigned_to ? profilesById.get(lead.assigned_to)?.full_name ?? 'Unknown' : 'Unassigned'}</span>
          </div>
          <div className="text-muted-foreground">
            Follow-up <span className="text-foreground">{formatDateTime(lead.follow_up_at)}</span>
          </div>
          <div className="text-muted-foreground">
            Created by <span className="text-foreground">{profilesById.get(lead.created_by)?.full_name ?? 'Unknown'}</span> ·{' '}
            {formatDateTime(lead.created_at)}
          </div>
          <div className="text-muted-foreground">
            Last edited {lead.last_edited_by ? `by ${profilesById.get(lead.last_edited_by)?.full_name ?? 'Unknown'} · ` : ''}
            {formatDateTime(lead.updated_at)}
          </div>
        </div>

        {lead.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lead.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Tabs defaultValue="notes" className="mt-5">
          <TabsList>
            <TabsTrigger value="notes">Notes & Contact History</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="space-y-4">
            {!lead.deleted_at && <AddNoteForm leadId={lead.id} onFollowUpRecorded={handleFollowUpRecorded} />}
            <NotesList leadId={lead.id} />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTimeline leadId={lead.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
