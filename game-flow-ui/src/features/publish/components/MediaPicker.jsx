import { UploadCloudIcon } from './publishIcons'

const ACCEPT = {
  game: '.html,.htm,.js,.json,.wasm,.data,.css,.png,.jpg,.jpeg,.webp,.mp3,.ogg',
  '3d': '.glb,.gltf,.bin,.png,.jpg,.jpeg,.webp',
  '2d': '.png,.jpg,.jpeg,.webp,.gif,.avif',
}

const HINTS = {
  game: 'Select the folder containing index.html and every WebGL build file.',
  '3d': 'Select the .glb or .gltf model plus any textures or sidecar files.',
  '2d': 'Select the primary image file for your artwork.',
}

export default function MediaPicker({ type, error, onAssetsChange, onCoverChange }) {
  return <div className="publish-media-picker" id="assets-picker">
    <div className="publish-picker-card">
      <div><strong>Main assets</strong><p>{HINTS[type]}</p></div>
      <label className="publish-file-button"><UploadCloudIcon />Choose files<input type="file" multiple accept={ACCEPT[type]} {...(type === 'game' ? { webkitdirectory: '', directory: '' } : {})} onChange={onAssetsChange} /></label>
    </div>
    {error ? <p className="publish-field-error" role="alert">{error}</p> : null}
    <div className="publish-picker-card">
      <div><strong>Cover thumbnail</strong><p>Optional, but recommended for games and 3D projects.</p></div>
      <label className="publish-file-button publish-file-button--secondary">Choose cover<input type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.avif" onChange={onCoverChange} /></label>
    </div>
  </div>
}
