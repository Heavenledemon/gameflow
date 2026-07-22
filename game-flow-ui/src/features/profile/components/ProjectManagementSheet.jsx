import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../../components/ui/Form'
import { Dialog } from '../../../components/ui/Overlay'

function valuesFromProject(project) {
  return {
    title: project?.title || '', category: project?.category || '', description: project?.description || '',
    type: project?.type || 'game', mode: project?.mode || 'landscape', visibility: project?.visibility || 'public',
    tags: (project?.tags || []).join(', '), software: (project?.software || []).join(', '),
  }
}

export default function ProjectManagementSheet({ project, saving, onClose, onSave }) {
  const [values, setValues] = useState(() => valuesFromProject(project))
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(project?.previewUrl || '')
  useEffect(() => () => { if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))
  const selectPreview = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPreviewFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }
  const submit = (event) => {
    event.preventDefault()
    onSave({ ...values, tags: values.tags.split(',').map((item) => item.trim()).filter(Boolean), software: values.software.split(',').map((item) => item.trim()).filter(Boolean) }, previewFile)
  }
  return <Dialog open={Boolean(project)} title="Edit project" description={project?.title} onClose={onClose} closeOnBackdrop={!saving} closeOnEscape={!saving} contentClassName="profile-form-dialog">
    <form className="profile-form" onSubmit={submit}>
      <Field label="Title"><Input value={values.title} onChange={update('title')} required /></Field>
      <Field label="Category"><Input value={values.category} onChange={update('category')} /></Field>
      <Field label="Description"><Textarea value={values.description} onChange={update('description')} /></Field>
      <div className="profile-form__grid"><Field label="Type"><Select value={values.type} onChange={update('type')}><option value="game">Game (HTML/WebGL)</option><option value="3d">3D model</option><option value="2d">2D image/artwork</option></Select></Field><Field label="Aspect ratio"><Select value={values.mode} onChange={update('mode')}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></Select></Field></div>
      <Field label="Visibility"><Select value={values.visibility} onChange={update('visibility')}><option value="public">Public</option><option value="private">Private</option></Select></Field>
      <Field label="Tags" help="Separate tags with commas."><Input value={values.tags} onChange={update('tags')} /></Field>
      <Field label="Software used" help="Separate tools with commas."><Input value={values.software} onChange={update('software')} /></Field>
      <Field label="Preview image">{previewUrl ? <img className="profile-form__preview" src={previewUrl} alt="Project preview" /> : null}<label className="profile-form__file">Choose preview image<input type="file" accept="image/*" onChange={selectPreview} /></label></Field>
      <div className="profile-form__actions"><Button variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>Save project</Button></div>
    </form>
  </Dialog>
}
