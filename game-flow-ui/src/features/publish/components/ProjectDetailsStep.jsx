import { Chip } from '../../../components/ui/Surface'
import { Field, Input, Select, Textarea } from '../../../components/ui/Form'
import { Button } from '../../../components/ui/Button'

export const CATEGORY_OPTIONS = {
  game: ['Action', 'Puzzle', 'Arcade', 'Simulation', 'Strategy', 'Casual'],
  video: ['Animation', 'Gameplay', 'Cinematic', 'Motion Graphics', 'VFX', 'Showreel'],
  '3d': ['Character', 'Environment', 'Prop', 'Hard Surface', 'Sculpt', 'Vehicle'],
  '2d': ['Illustration', 'Concept Art', 'Texture', 'UI/UX', 'Poster', 'Sprite'],
}

const SOFTWARE_SUGGESTIONS = ['Unity', 'Unreal Engine', 'Blender', 'Godot', 'Maya', 'ZBrush', 'Substance Painter', 'Photoshop', 'After Effects']

function TokenEditor({ label, values, input, onInputChange, onAdd, onRemove, suggestionsId, suggestions }) {
  return <Field label={label}><div className="publish-token-list">{values.map((value) => <Chip key={value}>{value}<button type="button" onClick={() => onRemove(value)} aria-label={`Remove ${value}`}>×</button></Chip>)}</div><div className="publish-token-input"><Input value={input} list={suggestionsId} onChange={(event) => onInputChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); onAdd() } }} placeholder="Type and press Enter" /><Button variant="secondary" onClick={onAdd}>Add</Button></div>{suggestionsId ? <datalist id={suggestionsId}>{suggestions.map((value) => <option value={value} key={value} />)}</datalist> : null}</Field>
}

export default function ProjectDetailsStep({ draft, errors, tagInput, softwareInput, onChange, onTagInputChange, onSoftwareInputChange, onAddTag, onAddSoftware, onRemoveTag, onRemoveSoftware }) {
  const categories = CATEGORY_OPTIONS[draft.type] || CATEGORY_OPTIONS.game
  return <div className="publish-details">
    <Field label="Project title *" htmlFor="publish-title" error={errors.title}><Input id="publish-title" value={draft.title} invalid={Boolean(errors.title)} maxLength={120} onChange={(event) => onChange('title', event.target.value)} placeholder="e.g. Neon Cube Composition" /></Field>
    <div className="publish-details__split"><Field label="Category *" htmlFor="publish-category" error={errors.category}><Select id="publish-category" value={draft.category} invalid={Boolean(errors.category)} onChange={(event) => onChange('category', event.target.value)}>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field><Field label="Visibility"><div className="publish-visibility" role="group" aria-label="Project visibility">{['public', 'private'].map((value) => <button type="button" key={value} aria-pressed={draft.visibility === value} onClick={() => onChange('visibility', value)}>{value}</button>)}</div></Field></div>
    <Field label="Description" htmlFor="publish-description"><Textarea id="publish-description" value={draft.description} maxLength={4000} onChange={(event) => onChange('description', event.target.value)} placeholder="Describe the concept, tools, and experience behind this project." /></Field>
    <TokenEditor label="Tags" values={draft.tags} input={tagInput} onInputChange={onTagInputChange} onAdd={onAddTag} onRemove={onRemoveTag} />
    <TokenEditor label="Software used" values={draft.software} input={softwareInput} onInputChange={onSoftwareInputChange} onAdd={onAddSoftware} onRemove={onRemoveSoftware} suggestionsId="publish-software-list" suggestions={SOFTWARE_SUGGESTIONS} />
  </div>
}
