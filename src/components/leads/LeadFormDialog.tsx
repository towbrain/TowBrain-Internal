import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { leadFormSchema, type LeadFormValues } from '@/schemas/leadSchema'
import { createLead, updateLead } from '@/lib/leadsApi'
import { addLeadNote } from '@/lib/notesApi'
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck'
import { isoToLocalDateTime, localDateTimeToIso } from '@/utils/dateHelpers'
import { LEAD_SOURCES, APPROVAL_STATUS_LABELS, type Lead, type Profile, type PipelineStage } from '@/types/domain'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DuplicateWarning } from '@/components/leads/DuplicateWarning'

export function LeadFormDialog({
  trigger,
  lead,
  profiles,
  stages,
  onSaved,
  defaultStatus,
}: {
  trigger: ReactNode
  lead?: Lead
  profiles: Profile[]
  stages: PipelineStage[]
  onSaved?: (lead: Lead) => void
  defaultStatus?: string
}) {
  const [open, setOpen] = useState(false)
  const isEdit = Boolean(lead)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead
      ? {
          client_name: lead.client_name,
          company_name: lead.company_name ?? '',
          email: lead.email ?? '',
          phone: lead.phone ?? '',
          website: lead.website ?? '',
          source: lead.source ?? '',
          status: lead.status,
          approval_status: lead.approval_status,
          assigned_to: lead.assigned_to ?? '',
          follow_up_at: isoToLocalDateTime(lead.follow_up_at),
          notes: '',
          tags: lead.tags.join(', '),
        }
      : {
          client_name: '',
          company_name: '',
          email: '',
          phone: '',
          website: '',
          source: '',
          status: defaultStatus ?? stages[0]?.key ?? '',
          approval_status: 'not_submitted',
          assigned_to: '',
          follow_up_at: '',
          notes: '',
          tags: '',
        },
  })

  const email = watch('email') ?? ''
  const phone = watch('phone') ?? ''
  const duplicates = useDuplicateCheck(email, phone, lead?.id)

  async function onSubmit(values: LeadFormValues) {
    const payload = {
      client_name: values.client_name,
      company_name: values.company_name || null,
      email: values.email || null,
      phone: values.phone || null,
      website: values.website || null,
      source: values.source || null,
      status: values.status,
      approval_status: values.approval_status,
      assigned_to: values.assigned_to || null,
      follow_up_at: localDateTimeToIso(values.follow_up_at),
      tags: values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    }

    if (isEdit && lead) {
      const result = await updateLead(lead.id, payload, lead.updated_at)
      if (!result.ok) {
        if (result.conflict) {
          toast.error('This lead was changed by someone else. Reload it and try again.')
        } else {
          toast.error(result.error)
        }
        return
      }
      toast.success('Lead updated')
      onSaved?.(result.data)
    } else {
      const { data, error } = await createLead(payload)
      if (error || !data) {
        toast.error(error?.message ?? 'Could not create lead')
        return
      }
      if (values.notes) {
        await addLeadNote({ lead_id: data.id, kind: 'note', note_text: values.notes })
      }
      toast.success('Lead created')
      onSaved?.(data)
    }
    setOpen(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit lead' : 'Add lead'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update this lead’s details.' : 'Only the client name is required — fill in the rest as you learn it.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <DuplicateWarning matches={duplicates} />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client_name">Client name *</Label>
              <Input id="client_name" {...register('client_name')} aria-invalid={Boolean(errors.client_name)} />
              {errors.client_name && <p className="text-xs text-destructive">{errors.client_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company</Label>
              <Input id="company_name" {...register('company_name')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register('website')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} aria-invalid={Boolean(errors.email)} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>

            <div className="space-y-1.5">
              <Label>Lead source</Label>
              <select
                {...register('source')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                <option value="">—</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" placeholder="comma, separated" {...register('tags')} />
            </div>

            <div className="space-y-1.5">
              <Label>Pipeline stage</Label>
              <select
                {...register('status')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                {stages.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Approval status</Label>
              <select
                {...register('approval_status')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                {Object.entries(APPROVAL_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned to</Label>
              <select
                {...register('assigned_to')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="follow_up_at">Follow-up date</Label>
              <Input id="follow_up_at" type="datetime-local" {...register('follow_up_at')} />
            </div>

            {!isEdit && (
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="notes">Initial notes</Label>
                <Textarea id="notes" rows={3} {...register('notes')} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

