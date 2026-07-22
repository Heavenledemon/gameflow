import { SegmentedControl } from '../../../components/ui/ControlComponents'

const PRIMARY_OPTIONS = [
  { value: 'requests', label: 'Requests', panelId: 'inbox-panel-requests' },
  { value: 'projects', label: 'Project chats', panelId: 'inbox-panel-projects' },
  { value: 'messages', label: 'Messages', panelId: 'inbox-panel-messages' },
]

const REQUEST_OPTIONS = [
  { value: 'incoming', label: 'Incoming', panelId: 'inbox-panel-requests' },
  { value: 'outgoing', label: 'Sent', panelId: 'inbox-panel-requests' },
]

export default function InboxTabs({ activeTab, onTabChange, requestBox, onRequestBoxChange }) {
  return <div className="inbox-controls">
    <SegmentedControl options={PRIMARY_OPTIONS} selected={activeTab} onSelect={onTabChange} semantics="tabs" label="Inbox sections" className="inbox-tabs" />
    {activeTab === 'requests' ? <SegmentedControl options={REQUEST_OPTIONS} selected={requestBox} onSelect={onRequestBoxChange} semantics="tabs" label="Request direction" className="inbox-request-tabs" /> : null}
  </div>
}
