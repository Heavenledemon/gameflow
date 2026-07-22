import { Button } from '../../../components/ui/Button'

export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function FileRow({ item, status, onRemove }) {
  const state = status?.status || 'ready'
  return <li className={`publish-file-row publish-file-row--${state}`}>
    <span className="publish-file-row__copy"><strong>{item.relativePath}</strong><small>{formatBytes(item.file.size)}</small></span>
    <span className="publish-file-row__status" role={state === 'uploading' ? 'status' : undefined}>{state === 'ready' ? 'Ready' : state === 'uploading' ? 'Uploading…' : state === 'complete' ? 'Uploaded' : 'Upload failed'}</span>
    {onRemove && state !== 'uploading' ? <button type="button" onClick={() => onRemove(item.relativePath)} aria-label={`Remove ${item.relativePath}`}>Remove</button> : null}
  </li>
}

export default function FilesStep({ assets, cover, statuses = {}, onRemoveAsset, onRemoveCover, retryAvailable, onRetry, retrying = false }) {
  const totalSize = assets.reduce((sum, item) => sum + item.file.size, 0) + (cover?.file.size || 0)
  return <section className="publish-files" aria-labelledby="publish-files-title">
    <header><div><h3 id="publish-files-title">Selected files</h3><p>{assets.length} main file{assets.length === 1 ? '' : 's'} · {formatBytes(totalSize)}</p></div>{retryAvailable ? <Button variant="secondary" loading={retrying} onClick={onRetry}>Retry failed uploads</Button> : null}</header>
    {assets.length ? <ul>{assets.map((item) => <FileRow key={item.relativePath} item={item} status={statuses[item.relativePath]} onRemove={onRemoveAsset} />)}</ul> : <p className="publish-files__empty">No main assets selected.</p>}
    <div className="publish-cover-row"><div><strong>Cover thumbnail</strong><span>{cover ? `${cover.file.name} · ${formatBytes(cover.file.size)}` : 'No cover selected'}</span></div>{cover && onRemoveCover ? <button type="button" onClick={onRemoveCover}>Remove</button> : null}{cover ? <span className={`publish-file-row__status publish-file-row__status--${statuses[cover.relativePath]?.status || 'ready'}`}>{statuses[cover.relativePath]?.status === 'uploading' ? 'Uploading…' : statuses[cover.relativePath]?.status === 'complete' ? 'Uploaded' : statuses[cover.relativePath]?.status === 'failed' ? 'Upload failed' : 'Ready'}</span> : null}</div>
  </section>
}
