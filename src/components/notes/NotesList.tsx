import { useLeadNotes } from '@/hooks/useLeadNotes'
import { useProfiles } from '@/hooks/useProfiles'
import { formatDateTime } from '@/utils/dateHelpers'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export function NotesList({ leadId }: { leadId: string }) {
  const { notes, loading } = useLeadNotes(leadId)
  const { profilesById } = useProfiles()

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground">No notes yet. Add the first one above.</p>
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-md border border-border p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">
              {profilesById.get(note.author_id)?.full_name ?? 'a former team member'}
            </span>
            <div className="flex items-center gap-2">
              {note.kind === 'contact_attempt' && <Badge variant="secondary">{note.contact_method}</Badge>}
              <span className="text-xs text-muted-foreground">{formatDateTime(note.created_at)}</span>
            </div>
          </div>
          <p className="text-sm text-foreground">{note.note_text}</p>
          {note.kind === 'contact_attempt' && (
            <p className="mt-1 text-xs text-muted-foreground">
              Outcome: {note.contact_outcome}
              {note.next_follow_up_at && ` · Next follow-up: ${formatDateTime(note.next_follow_up_at)}`}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
