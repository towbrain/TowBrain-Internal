import { useEffect } from 'react'
import type { UserPreferences } from '@/types/domain'

const STORAGE_KEY = 'crm-theme'

export function applyTheme(theme: UserPreferences['theme']) {
  const root = document.documentElement
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme)
  } else {
    root.removeAttribute('data-theme')
  }
  try {
    if (theme) localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Private browsing / blocked storage: theme just won't persist across reloads.
  }
}

export function useTheme(theme: UserPreferences['theme'] | undefined) {
  useEffect(() => {
    if (theme) {
      applyTheme(theme)
      return
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as UserPreferences['theme'] | null
      if (stored) applyTheme(stored)
    } catch {
      // ignore
    }
  }, [theme])
}
