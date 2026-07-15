import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { acceptCollaborationRequest, cancelCollaborationRequest, declineCollaborationRequest } from '../../lib/collaboration'
import { useInbox } from '../../hooks/useInbox'

const styles = { page: { height: '100%', overflowY: 'auto', padding: '24px 16px 100px', background: '#0B0D12', color: '#fff' }, tabs: { display: 'flex', gap: 8, margin: '18px 0' }, tab: (active) => ({ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,.1)', background: active ? '#FF7A59' : 'rgba(255,255,255,.04)', color: '#fff', fontWeight: 700 }), card: { padding: 14, marginBottom: 10, border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, background: 'rgba(255,255,255,.04)' }, action: { padding: '8px 11px', borderRadius: 9, border: 0, fontWeight: 700, cursor: 'pointer' } }

export default function InboxPage() {
  const { token } = useAuth()
  const [box, setBox] = useState('incoming')
  const [working, setWorking] = useState('')
  const { items, status, error, nextCursor, loadMore, reload, setItems } = useInbox(token, box)
  const act = async (item, action) => {
    setWorking(item.id)
    try {
      const result = action === 'accept' ? await acceptCollaborationRequest(token, item.id) : action === 'decline' ? await declineCollaborationRequest(token, item.id) : await cancelCollaborationRequest(token, item.id)
      setItems((current) => current.map((entry) => entry.id === item.id ? result.request : entry).filter((entry) => entry.status === 'pending'))
    } catch (requestError) { window.alert(requestError.message || 'Unable to update this request.') } finally { setWorking('') }
  }
  return <main style={styles.page}>
    <h1 style={{ margin: 0, fontSize: 25 }}>Inbox</h1>
    <p style={{ color: 'rgba(255,255,255,.6)', margin: '6px 0 0' }}>Collaboration requests</p>
    <div style={styles.tabs}><button style={styles.tab(box === 'incoming')} onClick={() => setBox('incoming')}>Requests</button><button style={styles.tab(box === 'outgoing')} onClick={() => setBox('outgoing')}>Sent</button></div>
    {status === 'loading' && <p>Loading requests…</p>}
    {status === 'error' && <div><p style={{ color: '#ff9a82' }}>{error}</p><button onClick={reload}>Try again</button></div>}
    {status === 'ready' && !items.length && <p style={{ color: 'rgba(255,255,255,.6)', textAlign: 'center', padding: 32 }}>No pending collaboration requests.</p>}
    {items.map((item) => { const person = box === 'incoming' ? item.requester : item.recipient; return <article key={item.id} style={styles.card}><strong>{item.project?.title || 'Project'}</strong><p style={{ margin: '7px 0', color: 'rgba(255,255,255,.78)' }}>{box === 'incoming' ? `@${person?.username || 'creator'} wants to collaborate as ${item.proposedRole}.` : `Sent to @${person?.username || 'creator'} as ${item.proposedRole}.`}</p>{item.message && <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,.56)' }}>{item.message}</p>}<div style={{ display: 'flex', gap: 8 }}>{box === 'incoming' ? <><button disabled={working === item.id} style={{ ...styles.action, background: '#FF7A59', color: '#fff' }} onClick={() => act(item, 'accept')}>Accept</button><button disabled={working === item.id} style={{ ...styles.action, background: 'rgba(255,255,255,.1)', color: '#fff' }} onClick={() => act(item, 'decline')}>Decline</button></> : <button disabled={working === item.id} style={{ ...styles.action, background: 'rgba(255,255,255,.1)', color: '#fff' }} onClick={() => act(item, 'cancel')}>Cancel</button>}</div></article> })}
    {nextCursor && <button onClick={loadMore} style={{ ...styles.action, width: '100%', background: 'rgba(255,255,255,.1)', color: '#fff' }}>Load more</button>}
  </main>
}
