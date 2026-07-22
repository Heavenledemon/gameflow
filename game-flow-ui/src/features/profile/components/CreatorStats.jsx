function formatCount(value) {
  if (typeof value === 'number' && value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (typeof value === 'number' && value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

export default function CreatorStats({ stats = [] }) {
  const visible = stats.filter((stat) => stat.value !== null && stat.value !== undefined && stat.value !== '')
  if (!visible.length) return null
  return <dl className="creator-stats" aria-label="Creator statistics">{visible.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{formatCount(stat.value)}</dd></div>)}</dl>
}
