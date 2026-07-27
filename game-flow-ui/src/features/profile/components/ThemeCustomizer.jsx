import { backgroundOptions, navbarOptions, useTheme } from '../../../context/ThemeContext'
import './ThemeCustomizer.css'

function ColorChoices({ label, options, value, onChange }) {
  return <fieldset className="theme-customizer__group">
    <legend>{label}</legend>
    <div className="theme-customizer__choices">
      {options.map(({ color, text }) => {
        const selected = value === color
        return <button
          key={color}
          type="button"
          className={`theme-customizer__swatch${selected ? ' theme-customizer__swatch--selected' : ''}`}
          style={{ '--swatch-color': color, '--swatch-text': text }}
          aria-label={`${label}: ${color}`}
          aria-pressed={selected}
          title={color}
          onClick={() => onChange(color)}
        >
          <span aria-hidden="true">{selected ? '✓' : ''}</span>
        </button>
      })}
    </div>
  </fieldset>
}

export default function ThemeCustomizer() {
  const { background, navbar, setBackground, setNavbar } = useTheme()

  return <section className="theme-customizer" aria-labelledby="theme-customizer-title">
    <div>
      <h2 id="theme-customizer-title">Customize colors</h2>
      <p>Choose your app background and bottom navigation colors.</p>
    </div>
    <ColorChoices label="Background" options={backgroundOptions} value={background} onChange={setBackground} />
    <ColorChoices label="Bottom navigation" options={navbarOptions} value={navbar} onChange={setNavbar} />
  </section>
}
