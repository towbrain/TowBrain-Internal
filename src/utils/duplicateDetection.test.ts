import { describe, it, expect } from 'vitest'
import { normalizeEmail, normalizePhone, findPotentialDuplicates } from './duplicateDetection'
import type { Lead } from '@/types/domain'

function makeLead(overrides: Partial<Lead>): Lead {
  return {
    id: 'id-1',
    client_name: 'Test',
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
    ...overrides,
  }
}

describe('normalizeEmail / normalizePhone', () => {
  it('lowercases and trims email', () => {
    expect(normalizeEmail('  Jane@Example.com ')).toBe('jane@example.com')
  })

  it('strips non-digits from phone', () => {
    expect(normalizePhone('(555) 123-4567')).toBe('5551234567')
  })

  it('returns null for empty input', () => {
    expect(normalizeEmail('')).toBeNull()
    expect(normalizePhone(undefined)).toBeNull()
  })
})

describe('findPotentialDuplicates', () => {
  const existing = [
    makeLead({ id: 'a', email: 'jane@example.com', phone: '5551234567' }),
    makeLead({ id: 'b', email: 'other@example.com', phone: '9998887777' }),
    makeLead({ id: 'c', email: 'deleted@example.com', deleted_at: '2026-01-02T00:00:00Z' }),
  ]

  it('matches on normalized email regardless of case/whitespace', () => {
    const matches = findPotentialDuplicates(existing, { email: ' Jane@EXAMPLE.com ' })
    expect(matches.map((l) => l.id)).toEqual(['a'])
  })

  it('matches on normalized phone regardless of formatting', () => {
    const matches = findPotentialDuplicates(existing, { phone: '(555) 123-4567' })
    expect(matches.map((l) => l.id)).toEqual(['a'])
  })

  it('excludes the lead being edited', () => {
    const matches = findPotentialDuplicates(existing, { email: 'jane@example.com' }, 'a')
    expect(matches).toHaveLength(0)
  })

  it('ignores soft-deleted leads', () => {
    const matches = findPotentialDuplicates(existing, { email: 'deleted@example.com' })
    expect(matches).toHaveLength(0)
  })

  it('returns nothing when no email or phone given', () => {
    expect(findPotentialDuplicates(existing, {})).toHaveLength(0)
  })
})
