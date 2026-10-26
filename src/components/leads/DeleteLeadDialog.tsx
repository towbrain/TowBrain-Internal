import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { softDeleteLead, restoreLead } from '@/lib/leadsApi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Lead } from '@/types/domain'

export function DeleteLeadDialog({
  lead,
  trigger,
  onDeleted,
}: {
  lead: Lead
  trigger: ReactNode
  onDeleted?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    setBusy(true)
    const { error } = await softDeleteLead(lead.id)
    setBusy(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Lead deleted', {
      action: {
        label: 'Undo',
        onClick: async () => {
          const { error } = await restoreLead(lead.id)
          if (error) toast.error(error.message)
          else toast.success('Lead restored')
        },
      },
    })
    setOpen(false)
    onDeleted?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {lead.client_name}?</DialogTitle>
          <DialogDescription>
            This moves the lead to the deleted-leads list. An administrator can restore it later; nothing is
            permanently erased.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
