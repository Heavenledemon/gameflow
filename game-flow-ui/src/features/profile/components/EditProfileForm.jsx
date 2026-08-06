import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../../components/ui/Form'
import { Dialog } from '../../../components/ui/Overlay'
import { Avatar } from '../../../components/ui/Surface'
import { safeExternalUrl } from '../profileAdapters'
import ThemeCustomizer from './ThemeCustomizer'
import CompanionCustomizer from './CompanionCustomizer'
import DesignCustomizer from './DesignCustomizer'

const FIELDS = ['email', 'username', 'name', 'headline', 'location', 'bio', 'creatorType', 'website', 'github', 'itchio', 'behance', 'artstation', 'instagram', 'linkedin', 'skills', 'avatar', 'banner', 'companionType', 'companionMotion', 'companionEmotion', 'companionBubble', 'companionBubbleText', 'companionBubbleBehavior', 'companionFootprintsEnabled', 'profileDisplayType', 'profileDesignType', 'profileDesignPalette', 'profileDesignDensity', 'profileDesignLineStyle', 'profileDesignMotion', 'profileDesignInteraction', 'profileDesignDoodleTheme']

function initialValues(user) {
  const defaults = { creatorType: 'Game Developer', companionType: 'cosmic', companionMotion: 'subtle', companionEmotion: 'natural', companionBubble: 'work', companionBubbleBehavior: 'once', profileDisplayType: 'companion', profileDesignType: 'bauhaus', profileDesignPalette: 'midnight', profileDesignDensity: 'balanced', profileDesignLineStyle: 'clean', profileDesignMotion: 'subtle', profileDesignInteraction: 'rearrange', profileDesignDoodleTheme: 'Developer' }
  const values = Object.fromEntries(FIELDS.map((field) => [field, field === 'skills' ? (user?.skills || []).join(', ') : user?.[field] || defaults[field] || '']))
  values.companionFootprintsEnabled = user?.companionFootprintsEnabled !== false
  if (!['bauhaus', 'waves', 'doodles', 'botanicals'].includes(values.profileDesignType)) values.profileDesignType = 'bauhaus'
  if (!['subtle', 'playful', 'off'].includes(values.profileDesignMotion)) values.profileDesignMotion = 'subtle'
  if (!['none', 'colors', 'rearrange', 'reveal'].includes(values.profileDesignInteraction)) values.profileDesignInteraction = 'rearrange'
  return values
}

function imageToDataUrl(event, onValue, onError) {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { onError('Image is too large. Choose an image under 2 MB.'); return }
  const reader = new FileReader()
  reader.onloadend = () => onValue(String(reader.result || ''))
  reader.readAsDataURL(file)
}

export default function EditProfileForm({ open, user, saving, onClose, onSave }) {
  const [values, setValues] = useState(() => initialValues(user))
  const [error, setError] = useState('')
  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  const validateExternal = (field, label) => {
    if (values[field] && !safeExternalUrl(values[field])) return `${label} must be an HTTP or HTTPS URL.`
    return ''
  }
  const submit = async (event) => {
    event.preventDefault()
    const urlError = [['website', 'Website'], ['github', 'GitHub'], ['itchio', 'Itch.io'], ['behance', 'Behance'], ['artstation', 'ArtStation'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn']].map(([field, label]) => validateExternal(field, label)).find(Boolean)
    if (urlError) { setError(urlError); return }
    setError('')
    await onSave({ ...values, skills: values.skills.split(',').map((skill) => skill.trim()).filter(Boolean) })
  }

  return <Dialog open={open} title="Edit profile" description="Update your creator identity and portfolio links." onClose={onClose} closeOnBackdrop={!saving} closeOnEscape={!saving} contentClassName="profile-form-dialog">
    <form className="profile-form" onSubmit={submit}>
      {error ? <p className="profile-form__error" role="alert">{error}</p> : null}
      <div className="profile-form__media">
        <div><Avatar src={values.avatar} alt="" name={values.name || values.username} size="large" /><label className="profile-form__file">Upload photo<input type="file" accept="image/*" onChange={(event) => imageToDataUrl(event, (avatar) => setValues((current) => ({ ...current, avatar })), setError)} /></label>{values.avatar ? <Button variant="ghost" onClick={() => setValues((current) => ({ ...current, avatar: '' }))}>Remove photo</Button> : null}</div>
        <div className="profile-form__banner">{values.banner ? <img src={values.banner} alt="Banner preview" /> : <span>No banner selected</span>}<label className="profile-form__file">Upload banner<input type="file" accept="image/*" onChange={(event) => imageToDataUrl(event, (banner) => setValues((current) => ({ ...current, banner })), setError)} /></label></div>
      </div>
      <div className="profile-form__grid">
        <Field label="Email"><Input type="email" value={values.email} onChange={update('email')} required /></Field>
        <Field label="Username"><Input value={values.username} onChange={update('username')} required /></Field>
        <Field label="Full name"><Input value={values.name} onChange={update('name')} required /></Field>
        <Field label="Professional headline"><Input value={values.headline} onChange={update('headline')} /></Field>
        <Field label="Location"><Input value={values.location} onChange={update('location')} /></Field>
        <Field label="Creator category"><Select value={values.creatorType} onChange={update('creatorType')}><option>Web Developer</option><option>Game Developer</option><option>2D Artist</option><option>3D Artist</option></Select></Field>
      </div>
      <Field label="Bio"><Textarea value={values.bio} onChange={update('bio')} /></Field>
      <Field label="Skills" help="Separate skills with commas."><Input value={values.skills} onChange={update('skills')} /></Field>
      <Field label="Personal website"><Input value={values.website} onChange={update('website')} placeholder="https://example.com" /></Field>
      <div className="profile-form__grid">
        <Field label="GitHub"><Input value={values.github} onChange={update('github')} /></Field>
        <Field label="Itch.io"><Input value={values.itchio} onChange={update('itchio')} /></Field>
        <Field label="Behance"><Input value={values.behance} onChange={update('behance')} /></Field>
        <Field label="ArtStation"><Input value={values.artstation} onChange={update('artstation')} /></Field>
        <Field label="Instagram"><Input value={values.instagram} onChange={update('instagram')} /></Field>
        <Field label="LinkedIn"><Input value={values.linkedin} onChange={update('linkedin')} /></Field>
      </div>
      <section className="profile-display-picker" aria-labelledby="profile-display-title"><h3 id="profile-display-title" className="profile-settings__title">Profile display</h3><p>Choose what fills the creative space on your profile.</p><div>{[['none', 'None'], ['companion', 'Companion'], ['design', '2D design']].map(([value, label]) => <button key={value} type="button" className={values.profileDisplayType === value ? 'is-selected' : ''} onClick={() => setValues((current) => ({ ...current, profileDisplayType: value }))}>{label}</button>)}</div></section>
      {values.profileDisplayType === 'companion' ? <CompanionCustomizer type={values.companionType} motion={values.companionMotion} emotion={values.companionEmotion} bubble={values.companionBubble} bubbleText={values.companionBubbleText} bubbleBehavior={values.companionBubbleBehavior} onTypeChange={(companionType) => setValues((current) => ({ ...current, companionType }))} onMotionChange={(companionMotion) => setValues((current) => ({ ...current, companionMotion }))} onEmotionChange={(companionEmotion) => setValues((current) => ({ ...current, companionEmotion }))} onBubbleChange={(companionBubble) => setValues((current) => ({ ...current, companionBubble }))} onBubbleTextChange={(companionBubbleText) => setValues((current) => ({ ...current, companionBubbleText }))} onBubbleBehaviorChange={(companionBubbleBehavior) => setValues((current) => ({ ...current, companionBubbleBehavior }))} /> : null}
      {values.profileDisplayType === 'companion' ? <section className="companion-social-settings" aria-labelledby="visitor-footprints-title"><h3 id="visitor-footprints-title" className="profile-settings__title">Visitor footprints</h3><p>Allow signed-in visitors to deliberately leave a private reaction for you. Passive visits remain anonymous.</p><label><input type="checkbox" checked={values.companionFootprintsEnabled} onChange={(event) => setValues((current) => ({ ...current, companionFootprintsEnabled: event.target.checked }))}/><span>Accept intentional visitor footprints</span></label></section> : null}
      {values.profileDisplayType === 'design' ? <DesignCustomizer type={values.profileDesignType} palette={values.profileDesignPalette} density={values.profileDesignDensity} lineStyle={values.profileDesignLineStyle} motion={values.profileDesignMotion} interaction={values.profileDesignInteraction} doodleTheme={values.profileDesignDoodleTheme} status={values.companionBubble} statusText={values.companionBubbleText} statusBehavior={values.companionBubbleBehavior} onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}/> : null}
      <ThemeCustomizer />
      <div className="profile-form__actions"><Button variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>Save profile</Button></div>
    </form>
  </Dialog>
}
