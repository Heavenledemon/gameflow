import { CheckIcon, CubeIcon, GameIcon } from '../../../components/icons/Icons'

function VideoIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" /><polygon points="10 9 15 12 10 15 10 9" fill="currentColor" /></svg>
}

function PictureIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
}

const TYPE_OPTIONS = [
  { value: 'game', label: 'WebGL Game', description: 'Playable Unity, Godot, or custom WebGL build.', Icon: GameIcon },
  { value: 'video', label: 'Video / Animation / GIF', description: 'Gameplay clips, MP4/WebM videos, or animated GIFs.', Icon: VideoIcon },
  { value: '3d', label: '3D Art / Model', description: 'A .glb or .gltf asset with its textures.', Icon: CubeIcon },
  { value: '2d', label: '2D Art / Illustration', description: 'Images, concept art, posters, or turnarounds.', Icon: PictureIcon },
]

export default function ProjectTypeStep({ type, mode, error, onTypeChange, onModeChange }) {
  return <div className="publish-type-step">
    <fieldset id="project-type" aria-describedby={error ? 'project-type-error' : undefined}>
      <legend>Project type</legend>
      <div className="publish-type-options">{TYPE_OPTIONS.map(({ value, label, description, Icon }) => <label className={type === value ? 'publish-type-option publish-type-option--selected' : 'publish-type-option'} key={value}>
        <input type="radio" name="project-type" value={value} checked={type === value} onChange={() => onTypeChange(value)} />
        <span className="publish-type-option__icon" aria-hidden="true"><Icon /></span>
        <span><strong>{label}</strong><small>{description}</small></span>
        <span className="publish-type-option__check" aria-hidden="true">{type === value ? <CheckIcon size={12} /> : null}</span>
      </label>)}</div>
      {error ? <p id="project-type-error" className="publish-field-error" role="alert">{error}</p> : null}
    </fieldset>
    <fieldset><legend>Orientation</legend><div className="publish-orientation">{['portrait', 'landscape'].map((value) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => onModeChange(value)}>{value}</button>)}</div></fieldset>
  </div>
}
