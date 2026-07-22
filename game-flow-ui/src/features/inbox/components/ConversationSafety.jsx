import { Button } from '../../../components/ui/Button'
import { Sheet } from '../../../components/ui/Overlay'

export default function ConversationSafety({ open, targetAvailable, blocked, busy, reportReason, onReportReasonChange, onRequestBlock, onReport, onClose }) {
  return <Sheet open={open} title="Safety options" description="Manage this private conversation." onClose={onClose} closeOnBackdrop={!busy} closeOnEscape={!busy}>
    {!targetAvailable ? <p className="conversation-safety-empty">Safety actions need the other creator’s account ID. This conversation does not provide it yet, so no block or report request was sent.</p> : <div className="conversation-safety-sheet">
      <p>Block this creator to stop new messages and collaboration requests, or report a concern.</p>
      <Button variant="danger" disabled={busy} onClick={onRequestBlock}>{blocked ? 'Unblock creator' : 'Block creator'}</Button>
      <label>Report concern<textarea value={reportReason} maxLength={500} onChange={(event) => onReportReasonChange(event.target.value)} placeholder="Tell us what happened (up to 500 characters)" /></label>
      <Button variant="primary" loading={busy} disabled={!reportReason.trim()} onClick={onReport}>Submit report</Button>
    </div>}
  </Sheet>
}
