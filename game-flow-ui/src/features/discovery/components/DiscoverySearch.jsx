import { useId } from 'react'

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export default function DiscoverySearch({ value, onChange, onClear }) {
  const inputId = useId()
  const helpId = `${inputId}-help`

  return (
    <form className="discovery-search" role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor={inputId}>Search Discover</label>
      <div className="discovery-search__control">
        <SearchIcon />
        <input
          id={inputId}
          type="search"
          inputMode="search"
          autoComplete="off"
          value={value}
          aria-describedby={helpId}
          placeholder="Projects, creators, tags, or tools"
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? <button type="button" onClick={onClear}>Clear</button> : null}
      </div>
      <p id={helpId}>Search projects, tags, tools, and every creator on GameFlow.</p>
    </form>
  )
}
