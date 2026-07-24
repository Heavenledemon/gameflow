import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../../../components/ui/Avatar'
import { Button } from '../../../components/ui/Button'
import { Sheet } from '../../../components/ui/Overlay'
import { fetchUserFollows, toggleUserFollow } from '../../../lib/content'
import { createDirectConversation } from '../../../lib/messaging'

export default function FollowListSheet({ open, kind, userId, token, currentUserId, onClose, onChanged }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    if (!open || !userId) return undefined
    const controller = new AbortController()
    fetchUserFollows(userId, kind, token, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) { setItems(data.items || []); setStatus('ready') } })
      .catch((error) => { if (!controller.signal.aborted && error?.name !== 'AbortError') setStatus('error') })
    return () => controller.abort()
  }, [kind, open, token, userId])

  const toggle = async (person) => {
    if (!token || busyId) return
    setBusyId(person.id)
    try {
      const result = await toggleUserFollow(token, person.id)
      setItems((current) => current.map((item) => item.id === person.id ? { ...item, viewerIsFollowing: Boolean(result.following) } : item))
      onChanged?.(result)
    } finally { setBusyId('') }
  }

  const openProfile = (person) => {
    onClose()
    navigate(String(person.id) === String(currentUserId) ? '/app/profile' : `/app/creator/${person.id}`)
  }

  const message = async (person) => {
    if (!token || busyId) return
    setBusyId(person.id)
    try {
      const result = await createDirectConversation(token, person.id)
      onClose()
      navigate(`/app/inbox/${result.conversation.id}`, { state: { conversation: result.conversation, moderationTarget: person } })
    } finally { setBusyId('') }
  }

  return <Sheet open={open} title={kind === 'followers' ? 'Followers' : 'Following'} onClose={onClose}>
    <div className="follow-list">
      {status === 'loading' ? <p className="follow-list__state">Loading people…</p> : null}
      {status === 'error' ? <p className="follow-list__state">Unable to load this list.</p> : null}
      {status === 'ready' && !items.length ? <p className="follow-list__state">No {kind} yet.</p> : null}
      {items.map((person) => <div className="follow-list__person" key={person.id}>
        <button type="button" className="follow-list__identity" onClick={() => openProfile(person)}>
          <Avatar src={person.avatar} name={person.name || person.username} alt={person.name || person.username} size="md" />
          <span><strong>{person.name || person.username}</strong><small>@{person.username}</small></span>
        </button>
        {!person.isSelf && token ? <div className="follow-list__actions">{person.viewerIsFollowing ? <Button variant="secondary" disabled={Boolean(busyId)} onClick={() => message(person)}>Message</Button> : null}<Button variant={person.viewerIsFollowing ? 'secondary' : 'primary'} disabled={Boolean(busyId)} onClick={() => toggle(person)}>{person.viewerIsFollowing ? 'Following' : 'Follow'}</Button></div> : null}
      </div>)}
    </div>
  </Sheet>
}
