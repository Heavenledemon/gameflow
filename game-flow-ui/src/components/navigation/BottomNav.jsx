import { NavLink } from 'react-router-dom'
import { HomeIcon, ExploreIcon, BellIcon, ProfileIcon, PlusIcon } from '../icons/Icons'
import { useAuth } from '../../context/AuthContext'
import { useInbox } from '../../hooks/useInbox'
import { useMessagingRealtime } from '../../hooks/useMessagingRealtime'
import './BottomNav.css'

const destinations = [
  { key: 'home', label: 'Home', Icon: HomeIcon, target: '/app/home' },
  { key: 'explore', label: 'Discover', Icon: ExploreIcon, target: '/app/explore' },
  { key: 'publish', label: 'Publish', Icon: PlusIcon, target: '/app/upload', isPrimary: true },
  { key: 'inbox', label: 'Inbox', Icon: BellIcon, target: '/app/inbox' },
  { key: 'profile', label: 'Profile', Icon: ProfileIcon, target: '/app/profile' },
]

const BottomNav = () => {
  const { user, token } = useAuth()
  const { items: incomingRequests, reload: reloadIncomingRequests } = useInbox(token, 'incoming')

  useMessagingRealtime(token, {
    onEvent: (eventName) => {
      if (eventName.startsWith('collaboration.request')) reloadIncomingRequests()
    },
    onReady: reloadIncomingRequests,
  })

  const inboxCount = incomingRequests.length

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {destinations.map(({ key, label, Icon, target, isPrimary }) => {
        const accessibleLabel = key === 'inbox' && inboxCount > 0
          ? `${label}, ${inboxCount} pending collaboration ${inboxCount === 1 ? 'request' : 'requests'}`
          : label

        return (
          <NavLink
            key={key}
            to={target}
            aria-label={accessibleLabel}
            className={({ isActive }) => [
              isPrimary ? 'bottom-nav__item bottom-nav__item--publish' : 'bottom-nav__item',
              isActive ? 'bottom-nav__item--active' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {key === 'profile' && user?.avatar ? (
                <img className="bottom-nav__avatar" src={user.avatar} alt="" />
              ) : (
                <Icon size={26} />
              )}
              {key === 'inbox' && inboxCount > 0 ? (
                <span className="bottom-nav__badge">{inboxCount > 99 ? '99+' : inboxCount}</span>
              ) : null}
            </span>
            <span className="bottom-nav__label">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNav
