import { useId } from 'react'

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
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
          style={{ background: 'transparent', backgroundColor: 'transparent', border: 'none', boxShadow: 'none', outline: 'none' }}
        />
        {value ? <button type="button" aria-label="Clear search" onClick={onClear}><XIcon /></button> : null}
      </div>
      <p id={helpId}>Search projects, tags, tools, and every creator on GameFlow.</p>
    </form>
  )
}
