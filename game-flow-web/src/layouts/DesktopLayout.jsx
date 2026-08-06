import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useMessagingRealtime } from '../hooks/useMessagingRealtime.js'
import scopeCanvasLogo from '../../../game-flow-ui/src/assets/scope-canvas-logo.png'

const links = [['Home', '/home'], ['Explore', '/app/explore'], ['Upload', '/app/upload'], ['Inbox', '/app/inbox'], ['Profile', '/app/profile']]

export default function DesktopLayout() {
  const { user, token, logout } = useAuth()
  const { connectionState } = useMessagingRealtime(token)
  const navigate = useNavigate()
  return <div className="desktop-shell">
    <aside className="side-nav"><NavLink className="brand" to="/home"><img src={scopeCanvasLogo} alt="" className="inline-block h-8 w-8 object-contain align-middle" /> ScopeCanvas</NavLink><nav>{links.map(([label, to]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav><div className="nav-foot"><div className="user-chip"><span>{(user?.name || user?.username || 'G').slice(0, 1)}</span><div><b>{user?.name || user?.username}</b><small>{connectionState}</small></div></div><button className="text-button" onClick={() => { logout(); navigate('/signin') }}>Sign out</button><a className="text-button" href="/m">Mobile view</a></div></aside>
    <section className="main-area"><header className="topbar"><div><strong>ScopeCanvas</strong><small>Creative work, in motion</small></div><NavLink className="primary-button" to="/app/upload">New project</NavLink></header><Outlet /></section>
    <aside className="activity-panel"><h3>Activity</h3><p>Your desktop workspace is connected to the same projects, conversations, and realtime events as mobile.</p><div className="activity-dot"><i />Realtime {connectionState}</div><hr /><h3>Quick links</h3><NavLink to="/app/explore">Find creators</NavLink><NavLink to="/app/inbox">Open inbox</NavLink></aside>
  </div>
}
