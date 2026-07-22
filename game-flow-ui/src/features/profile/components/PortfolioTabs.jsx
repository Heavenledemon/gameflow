import { useId, useRef } from 'react'

export default function PortfolioTabs({ tabs, selected, onSelect, panelId }) {
  const generatedId = useId()
  const refs = useRef([])
  const moveFocus = (event, index) => {
    let next = null
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = tabs.length - 1
    if (next === null) return
    event.preventDefault()
    onSelect(tabs[next].id)
    refs.current[next]?.focus()
  }
  return <div className="portfolio-tabs" role="tablist" aria-label="Portfolio sections">{tabs.map((tab, index) => {
    const tabId = `${generatedId}-${tab.id}`
    return <button key={tab.id} ref={(node) => { refs.current[index] = node }} id={tabId} type="button" role="tab" aria-selected={selected === tab.id} aria-controls={panelId} tabIndex={selected === tab.id ? 0 : -1} onClick={() => onSelect(tab.id)} onKeyDown={(event) => moveFocus(event, index)}>{tab.label}{typeof tab.count === 'number' ? <span>{tab.count}</span> : null}</button>
  })}</div>
}
