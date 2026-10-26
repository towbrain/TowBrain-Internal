import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteLeadDialog } from './DeleteLeadDialog'
import type { Lead } from '@/types/domain'

const lead: Lead = {
  id: 'lead-1',
  client_name: 'Acme Corp',
  company_name: null,
  email: null,
  phone: null,
  website: null,
  google_maps_url: null,
  source: null,
  status: 'new',
  approval_status: 'not_submitted',
  assigned_to: null,
  tags: [],
  follow_up_at: null,
  created_by: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  last_edited_by: null,
  deleted_at: null,
  deleted_by: null,
}

describe('DeleteLeadDialog', () => {
  it('shows the client name in the confirmation before deleting', async () => {
    const user = userEvent.setup()
    render(<DeleteLeadDialog lead={lead} trigger={<button>Delete</button>} />)

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText(/delete acme corp\?/i)).toBeInTheDocument()
  })
})
