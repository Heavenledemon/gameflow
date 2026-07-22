import { IconButton } from '../../../components/ui/Button'
import { ChevronLeftIcon, DotsIcon } from '../../../components/icons/Icons'

export default function InboxTopBar({ title, subtitle, onBack, onAction, actionLabel = 'Conversation safety options' }) {
  return <div className="inbox-top-bar">
    {onBack ? <IconButton label="Back to inbox" onClick={onBack}><span aria-hidden="true"><ChevronLeftIcon size={20} /></span></IconButton> : <span className="inbox-top-bar__spacer" aria-hidden="true" />}
    <div className="inbox-top-bar__copy"><h1>{title}</h1>{subtitle ? <span>{subtitle}</span> : null}</div>
    {onAction ? <IconButton label={actionLabel} onClick={onAction}><span aria-hidden="true"><DotsIcon size={20} /></span></IconButton> : <span className="inbox-top-bar__spacer" aria-hidden="true" />}
  </div>
}
