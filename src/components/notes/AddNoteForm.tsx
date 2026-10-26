import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { noteFormSchema, contactAttemptSchema, type NoteFormValues, type ContactAttemptValues } from '@/schemas/leadSchema'
import { addLeadNote } from '@/lib/notesApi'
import { localDateTimeToIso } from '@/utils/dateHelpers'
import { CONTACT_METHODS, NOTE_TEMPLATES } from '@/types/domain'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function AddNoteForm({
  leadId,
  onAdded,
  onFollowUpRecorded,
}: {
  leadId: string
  onAdded?: () => void
  /** Called with the ISO follow-up date after a contact attempt records one, so the
   * parent can propagate it onto the lead's own follow_up_at field. */
  onFollowUpRecorded?: (iso: string) => void
}) {
  return (
    <Tabs defaultValue="note">
      <TabsList>
        <TabsTrigger value="note">Note</TabsTrigger>
        <TabsTrigger value="contact">Contact attempt</TabsTrigger>
      </TabsList>
      <TabsContent value="note">
        <NoteTab leadId={leadId} onAdded={onAdded} />
      </TabsContent>
      <TabsContent value="contact">
        <ContactTab leadId={leadId} onAdded={onAdded} onFollowUpRecorded={onFollowUpRecorded} />
      </TabsContent>
    </Tabs>
  )
}

function NoteTab({ leadId, onAdded }: { leadId: string; onAdded?: () => void }) {
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: { note_text: '' },
  })

  async function onSubmit(values: NoteFormValues) {
    const { error } = await addLeadNote({ lead_id: leadId, kind: 'note', note_text: values.note_text })
    if (error) {
      toast.error(error.message)
      return
    }
    reset()
    onAdded?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {NOTE_TEMPLATES.map((template) => (
          <button
            key={template}
            type="button"
            onClick={() => setValue('note_text', template)}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            {template}
          </button>
        ))}
      </div>
      <Textarea rows={3} placeholder="Add a note…" {...register('note_text')} />
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Add note'}
        </Button>
      </div>
    </form>
  )
}

function ContactTab({
  leadId,
  onAdded,
  onFollowUpRecorded,
}: {
  leadId: string
  onAdded?: () => void
  onFollowUpRecorded?: (iso: string) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactAttemptValues>({
    resolver: zodResolver(contactAttemptSchema),
    defaultValues: { contact_method: CONTACT_METHODS[0], contact_outcome: '', note_text: '', next_follow_up_at: '' },
  })

  async function onSubmit(values: ContactAttemptValues) {
    const nextFollowUpIso = localDateTimeToIso(values.next_follow_up_at)
    const { error } = await addLeadNote({
      lead_id: leadId,
      kind: 'contact_attempt',
      note_text: values.note_text,
      contact_method: values.contact_method,
      contact_outcome: values.contact_outcome,
      next_follow_up_at: nextFollowUpIso,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    if (nextFollowUpIso) onFollowUpRecorded?.(nextFollowUpIso)
    reset()
    onAdded?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <p className="text-xs text-muted-foreground">
        This records that you contacted the client manually — the app does not place calls or send emails.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Method</Label>
          <select {...register('contact_method')} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm">
            {CONTACT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_outcome">Outcome</Label>
          <Input id="contact_outcome" placeholder="e.g. Interested, No answer" {...register('contact_outcome')} />
          {errors.contact_outcome && <p className="text-xs text-destructive">{errors.contact_outcome.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note_text">Description</Label>
        <Textarea id="note_text" rows={2} {...register('note_text')} />
        {errors.note_text && <p className="text-xs text-destructive">{errors.note_text.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="next_follow_up_at">Next follow-up (optional)</Label>
        <Input id="next_follow_up_at" type="datetime-local" {...register('next_follow_up_at')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Record contact attempt'}
        </Button>
      </div>
    </form>
  )
}
