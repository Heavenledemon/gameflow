import ProjectTile from '../../project/components/ProjectTile'
import { Badge, Chip } from '../../../components/ui/Surface'
import FilesStep, { formatBytes } from './FilesStep'

const TYPE_LABELS = { game: 'WebGL Game', '3d': '3D Art / Model', '2d': '2D Art / Illustration' }

export default function PublishPreview({ model, draft, assets, cover, statuses, publishStatus, onRetry, retrying }) {
  const totalSize = assets.reduce((sum, item) => sum + item.file.size, 0) + (cover?.file.size || 0)
  const failed = Object.values(statuses).some((item) => item.status === 'failed')
  return <div className="publish-preview">
    <section className="publish-preview__tile" aria-labelledby="publish-preview-title"><header><div><p>Discovery-style preview</p><h3 id="publish-preview-title">How your project may appear</h3></div><Badge>Preview</Badge></header><div role="list" aria-label="Project tile preview"><ProjectTile project={model} /></div><p className="publish-preview__note">Interactive WebGL and 3D media stays poster-first. The project page becomes available after publishing.</p></section>
    <dl className="publish-preview__facts"><div><dt>Type</dt><dd>{TYPE_LABELS[draft.type]}</dd></div><div><dt>Visibility</dt><dd>{draft.visibility}</dd></div><div><dt>Files</dt><dd>{assets.length}</dd></div><div><dt>Total size</dt><dd>{formatBytes(totalSize)}</dd></div></dl>
    {draft.tags.length || draft.software.length ? <div className="publish-preview__tokens">{[...draft.tags.map((tag) => `#${tag}`), ...draft.software].slice(0, 8).map((value) => <Chip key={value}>{value}</Chip>)}</div> : null}
    <FilesStep assets={assets} cover={cover} statuses={statuses} retryAvailable={failed} onRetry={onRetry} retrying={retrying} />
    {publishStatus ? <p className="publish-status" role="status">{publishStatus}</p> : null}
  </div>
}
