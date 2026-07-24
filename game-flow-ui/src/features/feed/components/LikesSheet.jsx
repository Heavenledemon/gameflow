import Sheet from '../../../components/ui/Sheet'
import Avatar from '../../../components/ui/Avatar'
import { ErrorState, LoadingState } from '../../../components/ui/Feedback'

export default function LikesSheet({ open, project, items = [], status, error, onClose, onRetry, onCreator }) {
  return (
    <Sheet open={open} onClose={onClose} title="Likes" description={project ? `${project.title} · ${items.length} ${items.length === 1 ? 'person' : 'people'}` : ''} contentClassName="likes-sheet">
      {status === 'loading' ? <LoadingState label="Loading likes" /> : null}
      {status === 'error' ? <ErrorState title="Likes unavailable" description={error} onRetry={onRetry} /> : null}
      {status === 'ready' && !items.length ? <p className="likes-sheet__empty">No one has liked this project yet.</p> : null}
      {status === 'ready' && items.length ? <ul className="likes-sheet__list">{items.map((person) => (
        <li key={person.id}>
          <button type="button" className="likes-sheet__person" onClick={() => onCreator(person)}>
            <Avatar src={person.avatar} alt={person.name || person.username} name={person.name || person.username} size="md" />
            <span><strong>{person.name || person.username}</strong><small>@{person.username}</small></span>
          </button>
        </li>
      ))}</ul> : null}
    </Sheet>
  )
}
