export default function ConversationComposer({ draft, sending, disabled, blocked, sendError, onChange, onSend }) {
  const placeholder = disabled ? (blocked ? 'Messaging is blocked' : 'Replies are closed') : 'Write a message…'
  return <div className="conversation-composer-region">
    {sendError ? <p className="conversation-send-error" role="alert">{sendError}</p> : null}
    <footer className="conversation-composer">
      <textarea aria-label="Message" value={draft} maxLength={2000} disabled={disabled} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend() } }} placeholder={placeholder} />
      <button type="button" disabled={!draft.trim() || sending || disabled} onClick={onSend}>{sending ? 'Sending…' : 'Send'}</button>
    </footer>
  </div>
}
