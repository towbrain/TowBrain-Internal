import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { normalizeEmail, normalizePhone } from '@/utils/duplicateDetection'
import type { Lead } from '@/types/domain'

/** Debounced lookup of existing leads sharing a normalized email/phone. Non-blocking warning only. */
export function useDuplicateCheck(email: string, phone: string, excludeId?: string) {
  const [matches, setMatches] = useState<Lead[]>([])

  useEffect(() => {
    const normEmail = normalizeEmail(email)
    const normPhone = normalizePhone(phone)
    if (!normEmail && !normPhone) {
      setMatches([])
      return
    }

    const timeout = setTimeout(async () => {
      const filters = [
        normEmail ? `email_normalized.eq.${normEmail}` : null,
        normPhone ? `phone_normalized.eq.${normPhone}` : null,
      ].filter(Boolean)

      let query = supabase.from('leads').select('*').is('deleted_at', null).or(filters.join(','))
      if (excludeId) query = query.neq('id', excludeId)
      const { data } = await query.limit(5)
      setMatches(data ?? [])
    }, 400)

    return () => clearTimeout(timeout)
  }, [email, phone, excludeId])

  return matches
}
