export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  const diffMs = date.getTime() - Date.now()
  const diffMin = Math.round(diffMs / 60000)
  const abs = Math.abs(diffMin)

  if (abs < 1) return 'just now'
  const units: [number, string][] = [
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
  ]
  let value = diffMin
  let unit = 'minute'
  for (const [size, name] of units) {
    if (Math.abs(value) < size) {
      unit = name
      break
    }
    value = Math.trunc(value / size)
    unit = name
  }
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  return rtf.format(value, unit as Intl.RelativeTimeFormatUnit)
}

export function isOverdue(followUpAt: string | null): boolean {
  if (!followUpAt) return false
  return new Date(followUpAt).getTime() < Date.now()
}

/** Converts a <input type="datetime-local"> value to an ISO string, or null if empty. */
export function localDateTimeToIso(value: string | undefined | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/** Converts an ISO timestamp to a value usable by <input type="datetime-local">. */
export function isoToLocalDateTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
