export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatTime(hours: number): string {
  if (hours === 0) return '—'
  const abs = Math.abs(hours)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
  return hours < 0 ? `-${timeStr}` : timeStr
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins} minutes ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs} hours ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays} days ago`
}
