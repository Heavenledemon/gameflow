import { useId, useRef } from 'react'
import { GridIcon, PlayIcon, BookmarkOutlineIcon, HeartOutlineIcon, CollabIcon } from '../../../components/icons/Icons'

const TAB_ICONS = {
  projects: GridIcon,
  games: PlayIcon,
  saved: BookmarkOutlineIcon,
  liked: HeartOutlineIcon,
  collaborations: CollabIcon,
}

export default function PortfolioTabs({ tabs = [], selected, onSelect, panelId }) {
  const generatedId = useId()
  const refs = useRef([])

  // Only render tabs that have items/data
  const visibleTabs = tabs.filter((tab) => tab.projects?.length > 0 || tab.count > 0 || tab.alwaysShow)
  if (!visibleTabs.length) return null

  const moveFocus = (event, index) => {
    let next = null
    if (event.key === 'ArrowRight') next = (index + 1) % visibleTabs.length
    if (event.key === 'ArrowLeft') next = (index - 1 + visibleTabs.length) % visibleTabs.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = visibleTabs.length - 1
    if (next === null) return
    event.preventDefault()
    onSelect(visibleTabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div className="portfolio-tabs" role="tablist" aria-label="Portfolio sections">
      {visibleTabs.map((tab, index) => {
        const tabId = `${generatedId}-${tab.id}`
        const isSelected = selected === tab.id
        const IconComponent = TAB_ICONS[tab.id] || GridIcon

        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[index] = node
            }}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            className={`portfolio-tabs__tab ${isSelected ? 'portfolio-tabs__tab--active' : ''}`}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => moveFocus(event, index)}
            aria-label={tab.label}
          >
            <IconComponent size={22} className="portfolio-tabs__icon" />
          </button>
        )
      })}
    </div>
  )
}
