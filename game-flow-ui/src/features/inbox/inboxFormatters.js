export function formatInboxTime(value, includeDate = false) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  if (includeDate) return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const elapsed = Date.now() - date.getTime()
  if (elapsed < 60_000) return 'Now'
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h`
  if (elapsed < 604_800_000) return `${Math.floor(elapsed / 86_400_000)}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function safeInboxError(section) {
  if (section === 'requests') return 'Collaboration requests are unavailable right now.'
  if (section === 'messages') return 'Messages are unavailable right now.'
  return 'This conversation is unavailable right now.'
}
