import { describe, it, expect } from 'vitest'
import { leadFormSchema, contactAttemptSchema } from './leadSchema'

describe('leadFormSchema', () => {
  it('requires a client name', () => {
    const result = leadFormSchema.safeParse({ client_name: '', status: 'new', approval_status: 'not_submitted' })
    expect(result.success).toBe(false)
  })

  it('accepts a lead with only a client name', () => {
    const result = leadFormSchema.safeParse({
      client_name: 'Jane Doe',
      status: 'new',
      approval_status: 'not_submitted',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = leadFormSchema.safeParse({
      client_name: 'Jane Doe',
      status: 'new',
      approval_status: 'not_submitted',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown approval status', () => {
    const result = leadFormSchema.safeParse({
      client_name: 'Jane Doe',
      status: 'new',
      approval_status: 'maybe',
    })
    expect(result.success).toBe(false)
  })
})

describe('contactAttemptSchema', () => {
  it('requires method, outcome, and description', () => {
    const result = contactAttemptSchema.safeParse({ contact_method: '', contact_outcome: '', note_text: '' })
    expect(result.success).toBe(false)
  })

  it('accepts a complete contact attempt', () => {
    const result = contactAttemptSchema.safeParse({
      contact_method: 'Phone',
      contact_outcome: 'Interested',
      note_text: 'Spoke for 10 minutes',
    })
    expect(result.success).toBe(true)
  })
})
