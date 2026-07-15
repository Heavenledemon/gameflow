import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useConversation } from '../../hooks/useConversation'

export default function ConversationPage() {
  const { conversationId } = useParams(); const navigate = useNavigate(); const { token, user } = useAuth();
  const { items, status, error, draft, setDraft, send, reload } = useConversation(token, conversationId); const [sending, setSending] = useState(false);
  const submit = async () => { const body = draft.trim(); if (!body || sending) return; setSending(true); try { await send(body, crypto.randomUUID()) } catch {} finally { setSending(false) } };
  return <main style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0B0D12', color: '#fff' }}>
    <header style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', gap: 12, alignItems: 'center' }}><button aria-label="Back to inbox" onClick={() => navigate('/app/inbox')} style={{ border: 0, background: 'transparent', color: '#fff', fontSize: 22 }}>‹</button><strong>Conversation</strong></header>
    <section style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>{status === 'loading' && <p>Loading messages…</p>}{error && <div><p>{error}</p><button onClick={reload}>Try again</button></div>}{items.map((message) => { const mine = String(message.senderId) === String(user?.id) || message.senderId === 'me'; return <div key={message.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 12px', borderRadius: 14, background: mine ? '#FF7A59' : 'rgba(255,255,255,.1)', opacity: message.pending ? .65 : 1 }}><span>{message.body}</span>{message.failed && <button onClick={() => send(message.body, message.clientMessageId)} style={{ display: 'block', marginTop: 5, border: 0, background: 'transparent', color: '#fff', textDecoration: 'underline' }}>Retry</button>}</div>})}</section>
    <footer style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(255,255,255,.1)' }}><textarea aria-label="Message" value={draft} maxLength={2000} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }} placeholder="Write a message…" style={{ flex: 1, minHeight: 42, maxHeight: 100, resize: 'none', borderRadius: 12, padding: 10, background: 'rgba(255,255,255,.08)', color: '#fff', border: 0 }} /><button disabled={!draft.trim() || sending} onClick={submit} style={{ border: 0, borderRadius: 12, padding: '0 14px', color: '#fff', background: '#FF7A59' }}>Send</button></footer>
  </main>
}
