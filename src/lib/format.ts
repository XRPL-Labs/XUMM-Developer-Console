// A binary column as the API serialises it (Node Buffer JSON), to upper case hex
export const bufferJsonToHex = (value: unknown): string => {
  const data = (value as { data?: number[] } | null)?.data
  if (!Array.isArray(data)) return ''
  return data.map(b => Number(b).toString(16).padStart(2, '0')).join('').toUpperCase()
}

// 32 hex characters to the 8-4-4-4-12 notation
export const hexToUuid = (hex: string): string =>
  hex.length === 32 ? [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-') : hex

export const onlyHex = (value: string): string => value.toUpperCase().replace(/[^A-F0-9]/g, '')

export const timeAgo = (date: Date, now = Date.now()): string => {
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000))
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`

  if (seconds < 5) return 'just now'
  if (seconds < 60) return plural(seconds, 'second')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return plural(minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return plural(hours, 'hour')
  const days = Math.floor(hours / 24)
  if (days < 30) return plural(days, 'day')
  const months = Math.floor(days / 30)
  if (months < 12) return plural(months, 'month')
  return plural(Math.floor(days / 365), 'year')
}

export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // No clipboard API (no secure context): the selection + copy command
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    return ok
  }
}
