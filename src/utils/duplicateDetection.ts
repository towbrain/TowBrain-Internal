import type { Lead } from '@/types/domain'

export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

export function normalizePhone(phone: string | null | undefined): string | null {
  const digits = phone?.replace(/\D/g, '')
  return digits ? digits : null
}

/** Leads sharing a normalized email or phone with the candidate values, excluding `excludeId`. */
export function findPotentialDuplicates(
  leads: Lead[],
  candidate: { email?: string | null; phone?: string | null },
  excludeId?: string,
): Lead[] {
  const email = normalizeEmail(candidate.email)
  const phone = normalizePhone(candidate.phone)
  if (!email && !phone) return []

  return leads.filter((lead) => {
    if (lead.id === excludeId || lead.deleted_at) return false
    const sameEmail = email && normalizeEmail(lead.email) === email
    const samePhone = phone && normalizePhone(lead.phone) === phone
    return Boolean(sameEmail || samePhone)
  })
}
