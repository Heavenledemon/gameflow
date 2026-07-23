function formatCount(value) {
  if (typeof value === 'number' && value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (typeof value === 'number' && value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value ?? 0)
}

export default function CreatorStats({ stats = [] }) {
  if (!stats.length) return null

  return (
    <div className="creator-stats" aria-label="Creator statistics">
      {stats.map((stat) => (
        <div key={stat.label} className="creator-stats__item">
          <span className="creator-stats__value">{formatCount(stat.value)}</span>
          <span className="creator-stats__label">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
