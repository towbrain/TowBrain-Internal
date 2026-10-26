import { describe, it, expect } from 'vitest'
import { describeActivity, actorName } from './activityFormat'
import type { ActivityLog, PipelineStage, Profile } from '@/types/domain'

function makeProfile(id: string, full_name: string): Profile {
  return {
    id,
    full_name,
    avatar_url: null,
    role: 'member',
    is_active: true,
    preferences: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

function makeStage(key: string, label: string): PipelineStage {
  return { key, label, color: '#000', sort_order: 0, is_active: true, created_at: '2026-01-01T00:00:00Z' }
}

const profilesById = new Map([['u1', makeProfile('u1', 'Sarah')]])
const stagesByKey = new Map([
  ['new', makeStage('new', 'New')],
  ['contacted', makeStage('contacted', 'Contacted')],
])

function baseLog(overrides: Partial<ActivityLog>): ActivityLog {
  return {
    id: 'log-1',
    lead_id: 'lead-1',
    actor_id: 'u1',
    action: 'lead_created',
    old_values: null,
    new_values: null,
    details: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('actorName', () => {
  it('returns the profile name when known', () => {
    expect(actorName('u1', profilesById)).toBe('Sarah')
  })

  it('falls back for a deleted/unknown user', () => {
    expect(actorName('unknown', profilesById)).toBe('a former team member')
  })

  it('returns System for a null actor', () => {
    expect(actorName(null, profilesById)).toBe('System')
  })
})

describe('describeActivity', () => {
  it('describes a status change in plain English, never raw JSON', () => {
    const log = baseLog({
      action: 'status_changed',
      old_values: { status: 'new' },
      new_values: { status: 'contacted' },
    })
    const text = describeActivity(log, profilesById, stagesByKey)
    expect(text).toBe('Sarah changed the stage from New to Contacted.')
    expect(text).not.toContain('{')
  })

  it('describes lead creation', () => {
    const text = describeActivity(baseLog({ action: 'lead_created' }), profilesById, stagesByKey)
    expect(text).toBe('Sarah created this lead.')
  })

  it('describes a deletion', () => {
    const text = describeActivity(baseLog({ action: 'lead_deleted' }), profilesById, stagesByKey)
    expect(text).toBe('Sarah deleted this lead.')
  })
})
