import { UploadCloudIcon } from './publishIcons'

const ACCEPT = {
  game: '.html,.htm,.js,.json,.wasm,.data,.css,.png,.jpg,.jpeg,.webp,.mp3,.ogg,.mp4,.webm',
  video: '.mp4,.webm,.mov,.m4v,.gif,.png,.jpg,.jpeg,.webp',
  '3d': '.glb,.gltf,.bin,.png,.jpg,.jpeg,.webp,.mp4,.webm',
  '2d': '.png,.jpg,.jpeg,.webp,.gif,.avif,.mp4,.webm,.mov,.m4v',
}

const HINTS = {
  game: 'Select the folder containing index.html and every WebGL build file.',
  video: 'Select your video file (.mp4, .webm, .mov) or animated GIF.',
  '3d': 'Select the .glb or .gltf model plus any textures or sidecar files.',
  '2d': 'Select the primary image, GIF, or video file for your artwork.',
}

export default function MediaPicker({ type, error, onAssetsChange, onCoverChange, onGameplayGifChange }) {
  return <div className="publish-media-picker" id="assets-picker">
    {type !== 'video' ? <div className="publish-picker-card">
      <div><strong>Main assets</strong><p>{HINTS[type]}</p></div>
      <label className="publish-file-button"><UploadCloudIcon />Choose files<input type="file" multiple accept={ACCEPT[type]} {...(type === 'game' ? { webkitdirectory: '', directory: '' } : {})} onChange={onAssetsChange} /></label>
    </div> : null}
    {type === 'game' ? <div className="publish-picker-card">
      <div><strong>Gameplay GIF</strong><p>Optional. Add a short animated preview shown before viewers launch the game.</p></div>
      <label className="publish-file-button publish-file-button--secondary">Choose GIF<input type="file" accept=".gif,image/gif" onChange={onGameplayGifChange} /></label>
    </div> : null}
    {error ? <p className="publish-field-error" role="alert">{error}</p> : null}
    <div className="publish-picker-card">
      <div><strong>Cover thumbnail</strong><p>Optional, but recommended for games and 3D projects.</p></div>
      <label className="publish-file-button publish-file-button--secondary">Choose cover<input type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.avif" onChange={onCoverChange} /></label>
    </div>
  </div>
}
