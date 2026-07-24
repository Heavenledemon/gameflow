function formatCount(value) {
  if (typeof value === 'number' && value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (typeof value === 'number' && value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value ?? 0)
}

export default function CreatorStats({ stats = [], onSelect }) {
  if (!stats.length) return null

  return (
    <div className="creator-stats" aria-label="Creator statistics">
      {stats.map((stat) => (
        <button type="button" key={stat.label} className="creator-stats__item" disabled={!stat.action} onClick={() => stat.action && onSelect?.(stat.action)}>
          <span className="creator-stats__value">{formatCount(stat.value)}</span>
          <span className="creator-stats__label">{stat.label}</span>
        </button>
      ))}
    </div>
  )
}
