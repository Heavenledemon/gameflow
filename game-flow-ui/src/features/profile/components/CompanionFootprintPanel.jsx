import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Sheet } from '../../../components/ui/Overlay'
import Avatar from '../../../components/ui/Avatar'
import { FOOTPRINT_REACTIONS, fetchMyFootprint, removeMyFootprint, saveMyFootprint } from '../../../lib/footprints'

function reactionLabel(id) {
  return FOOTPRINT_REACTIONS.find((item) => item.id === id)?.label || 'Stopped by'
}

export default function CompanionFootprintPanel({ open, mode = 'visitor', creator, token, isGuest = false, footprints = [], loading = false, onClose, onSignIn, onChanged, onOpenVisitor }) {
  const [status, setStatus] = useState('idle')
  const [footprint, setFootprint] = useState(null)
  const [selected, setSelected] = useState('stopped_by')
  const [error, setError] = useState('')
  const creatorId = creator?.id

  useEffect(() => {
    if (!open || mode !== 'visitor' || isGuest || !token || !creatorId) return undefined
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return
      setStatus('loading')
      setError('')
    })
    fetchMyFootprint(token, creatorId, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return
      setFootprint(data.footprint || null)
      setSelected(data.footprint?.reaction || 'stopped_by')
      setStatus(data.enabled === false ? 'disabled' : 'ready')
    }).catch((requestError) => {
      if (requestError?.name === 'AbortError') return
      setError(requestError.message || 'Unable to load your footprint.')
      setStatus('error')
    })
    return () => controller.abort()
  }, [creatorId, isGuest, mode, open, token])

  const save = async () => {
    if (!creatorId || status === 'saving') return
    setStatus('saving'); setError('')
    try { const data = await saveMyFootprint(token, creatorId, selected); setFootprint(data.footprint); setStatus('ready'); onChanged?.(data.footprint) }
    catch (requestError) { setError(requestError.message || 'Unable to leave your footprint.'); setStatus('error') }
  }
  const remove = async () => {
    if (!creatorId || status === 'saving') return
    setStatus('saving'); setError('')
    try { await removeMyFootprint(token, creatorId); setFootprint(null); setSelected('stopped_by'); setStatus('ready'); onChanged?.(null) }
    catch (requestError) { setError(requestError.message || 'Unable to remove your footprint.'); setStatus('error') }
  }

  if (mode === 'owner') return <Sheet open={open} title="Recent footprints" description="Only visitors who deliberately chose to be seen appear here." onClose={onClose} contentClassName="footprint-panel">
    {loading ? <p className="footprint-panel__state">Checking for new footprints…</p> : null}
    {!loading && !footprints.length ? <div className="footprint-panel__empty"><span aria-hidden="true">⌾</span><strong>No footprints yet</strong><p>Passive visits remain anonymous. Visitors will appear only when they intentionally leave a footprint.</p></div> : null}
    {footprints.length ? <div className="footprint-panel__list">{footprints.map((item) => <button type="button" key={item.id} onClick={() => onOpenVisitor?.(item.visitor)}><Avatar src={item.visitor.avatar} name={item.visitor.name || item.visitor.username} alt="" size="sm"/><span><strong>{item.visitor.name || item.visitor.username}</strong><small>@{item.visitor.username} · {reactionLabel(item.reaction)}</small></span>{item.unread ? <i>New</i> : null}</button>)}</div> : null}
  </Sheet>

  return <Sheet open={open} title={`Leave a footprint for ${creator?.name || creator?.username || 'this creator'}`} description="A footprint is intentional and private." onClose={onClose} contentClassName="footprint-panel">
    {isGuest ? <div className="footprint-panel__empty"><span aria-hidden="true">✦</span><strong>Sign in to leave a footprint</strong><p>Your identity is shared only with this profile's owner after you choose a reaction.</p><Button onClick={onSignIn}>Sign in</Button></div> : <>
      <div className="footprint-panel__disclosure"><strong>The creator will see your username and avatar.</strong><p>Passive visits remain anonymous. You can change or remove this footprint at any time.</p></div>
      {status === 'disabled' ? <p className="footprint-panel__state">This creator is not accepting footprints right now.</p> : null}
      {status !== 'disabled' ? <div className="footprint-panel__reactions" aria-label="Choose a footprint reaction">{FOOTPRINT_REACTIONS.map((reaction) => <button type="button" key={reaction.id} className={selected === reaction.id ? 'is-selected' : ''} aria-pressed={selected === reaction.id} disabled={status === 'loading' || status === 'saving'} onClick={() => setSelected(reaction.id)}><span aria-hidden="true">{reaction.symbol}</span><strong>{reaction.label}</strong></button>)}</div> : null}
      {error ? <p className="footprint-panel__error" role="alert">{error}</p> : null}
      {status !== 'disabled' ? <div className="footprint-panel__actions"><Button loading={status === 'saving'} disabled={status === 'loading'} onClick={save}><span style={{ marginRight: 6, fontSize: '0.95em' }} aria-hidden="true">✦</span>{footprint ? 'Update footprint' : 'Leave footprint'}</Button>{footprint ? <Button variant="secondary" disabled={status === 'saving'} onClick={remove}>Remove</Button> : null}</div> : null}
    </>}
  </Sheet>
}
