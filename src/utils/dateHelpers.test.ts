import { describe, it, expect } from 'vitest'
import { isOverdue, localDateTimeToIso, isoToLocalDateTime } from './dateHelpers'

describe('isOverdue', () => {
  it('is false for a null date', () => {
    expect(isOverdue(null)).toBe(false)
  })

  it('is true for a past date', () => {
    expect(isOverdue('2020-01-01T00:00:00Z')).toBe(true)
  })

  it('is false for a future date', () => {
    expect(isOverdue('2099-01-01T00:00:00Z')).toBe(false)
  })
})

describe('localDateTimeToIso / isoToLocalDateTime', () => {
  it('returns null for empty input', () => {
    expect(localDateTimeToIso('')).toBeNull()
    expect(localDateTimeToIso(undefined)).toBeNull()
  })

  it('round-trips a datetime-local value', () => {
    const iso = localDateTimeToIso('2026-03-05T14:30')
    expect(iso).not.toBeNull()
    expect(isoToLocalDateTime(iso)).toBe('2026-03-05T14:30')
  })

  it('returns empty string for a null iso', () => {
    expect(isoToLocalDateTime(null)).toBe('')
  })
})
