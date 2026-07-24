function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export default function ConversationComposer({ draft, sending, disabled, blocked, sendError, onChange, onSend }) {
  const placeholder = disabled ? (blocked ? 'Messaging is blocked' : 'Replies are closed') : 'Write a message…'
  const canSubmit = draft.trim().length > 0 && !sending && !disabled

  return (
    <div className="conversation-composer-region">
      {sendError ? <p className="conversation-send-error" role="alert">{sendError}</p> : null}
      <footer className="conversation-composer">
        <div className="conversation-composer__pill">
          <textarea
            aria-label="Message"
            value={draft}
            rows={1}
            maxLength={2000}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (canSubmit) onSend()
              }
            }}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="conversation-composer__send-btn"
            disabled={!canSubmit}
            onClick={onSend}
            aria-label="Send message"
            title="Send message"
          >
            {sending ? <span className="conversation-composer__spinner" /> : <SendIcon />}
          </button>
        </div>
      </footer>
    </div>
  )
}
