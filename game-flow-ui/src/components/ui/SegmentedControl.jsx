import { useId, useRef } from 'react'
import './SegmentedControl.css'

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  selected, // Backward compatibility
  onSelect, // Backward compatibility
  disabled = false,
  semantics = 'tabs', // Backward compatibility
  label = 'View options',
  className = '',
}) {
  const generatedId = useId()
  const itemRefs = useRef([])
  const isTabs = semantics === 'tabs'

  const activeValue = value !== undefined ? value : selected
  const handleChange = onChange || onSelect

  const selectedIndex = options.findIndex(
    (option) => option.value === activeValue && !option.disabled
  )
  const firstEnabledIndex = options.findIndex((option) => !option.disabled)

  const moveTabFocus = (event, currentIndex) => {
    const enabledIndexes = options
      .map((option, index) => (option.disabled || disabled ? null : index))
      .filter((index) => index !== null)
    if (!enabledIndexes.length) return

    const currentPosition = enabledIndexes.indexOf(currentIndex)
    let nextIndex

    if (event.key === 'Home') {
      nextIndex = enabledIndexes[0]
    } else if (event.key === 'End') {
      nextIndex = enabledIndexes[enabledIndexes.length - 1]
    } else if (
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown'
    ) {
      nextIndex = enabledIndexes[(currentPosition + 1) % enabledIndexes.length]
    } else if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowUp'
    ) {
      nextIndex =
        enabledIndexes[
          (currentPosition - 1 + enabledIndexes.length) % enabledIndexes.length
        ]
    } else {
      return
    }

    event.preventDefault()
    itemRefs.current[nextIndex]?.focus()
    handleChange?.(options[nextIndex].value)
  }

  return (
    <div
      className={`gf-segmented-control ${className}`.trim()}
      role={isTabs ? 'tablist' : 'group'}
      aria-label={label}
      aria-orientation={isTabs ? 'horizontal' : undefined}
    >
      {options.map((opt, index) => {
        const isSelected = activeValue === opt.value
        const tabId = `${generatedId}-tab-${index}`
        const isItemDisabled = disabled || opt.disabled

        return (
          <button
            key={opt.value}
            ref={(node) => {
              itemRefs.current[index] = node
            }}
            type="button"
            role={isTabs ? 'tab' : undefined}
            id={isTabs ? tabId : undefined}
            aria-controls={isTabs ? opt.panelId : undefined}
            aria-selected={isTabs ? isSelected : undefined}
            aria-pressed={!isTabs ? isSelected : undefined}
            tabIndex={
              isTabs
                ? isSelected || (selectedIndex < 0 && index === firstEnabledIndex)
                  ? 0
                  : -1
                : undefined
            }
            disabled={isItemDisabled}
            onClick={() => handleChange?.(opt.value)}
            onKeyDown={
              isTabs ? (event) => moveTabFocus(event, index) : undefined
            }
            className={`gf-segmented-control__item ${
              isSelected ? 'gf-segmented-control__item--active' : ''
            }`.trim()}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
