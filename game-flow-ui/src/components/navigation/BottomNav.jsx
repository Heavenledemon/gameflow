import { NavLink } from 'react-router-dom';
import { HomeIcon, ExploreIcon, BellIcon, ProfileIcon, PlusIcon } from '../icons/Icons';
import { useAuth } from '../../context/AuthContext';
import { useInbox } from '../../hooks/useInbox';
import './BottomNav.css';

const BottomNav = () => {
  const { user, token } = useAuth();
  const { items: incomingRequests } = useInbox(token, 'incoming');
  const items = [
    { key: 'home',          label: 'Home',          Icon: HomeIcon,        target: '/app/home' },
    { key: 'explore',       label: 'Explore',       Icon: ExploreIcon,     target: '/app/explore' },
    { key: 'notifications', label: 'Alerts',        Icon: BellIcon,        target: '/app/notifications' },
    { key: 'profile',       label: 'Profile',       Icon: ProfileIcon,     target: '/app/profile' },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item, idx) => {
        // Insert FAB between Explore and Notifications
        const fab = idx === 2 ? (
          <NavLink
            key="fab"
            to="/app/upload"
            className={({ isActive }) => `fab-btn ${isActive ? 'fab-btn--active' : ''}`}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <PlusIcon size={22} />
          </NavLink>
        ) : null;

        return (
          <div key={item.key} style={{ display: 'contents' }}>
            {idx === 2 && fab}
            <NavLink
              to={item.target}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {item.key === 'profile' && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1.5px solid currentColor',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <item.Icon size={22} />
              )}
              {item.key === 'notifications' && incomingRequests.length > 0 && <span style={{ position: 'absolute', top: 4, right: 12, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 9, background: '#FF7A59', color: '#fff', fontSize: 9, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{incomingRequests.length > 9 ? '9+' : incomingRequests.length}</span>}
            </NavLink>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;
