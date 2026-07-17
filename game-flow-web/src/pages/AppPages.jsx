import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { createProject, fetchFeed, fetchProject, fetchProjects, publishProject, updateEngagement, uploadProjectFile } from '../lib/content.js'
import { fetchConversations, fetchMessages, sendMessage } from '../lib/messaging.js'
import { useMessagingRealtime } from '../hooks/useMessagingRealtime.js'

const titleFor = (item) => item.title || item.projectTitle || 'Untitled project'
const creatorFor = (item) => item.creator?.name || item.creator?.username || item.owner?.name || 'GameFlow creator'
const idFor = (item) => item.id || item._id || item.projectId || item.feedId

function PageHeading({ eyebrow, title, action }) { return <div className="page-heading"><div><small>{eyebrow}</small><h1>{title}</h1></div>{action}</div> }
function Loading({ label = 'Loading…' }) { return <div className="empty-state">{label}</div> }
function ProjectCard({ item }) { const id = idFor(item); return <Link className="project-card" to={`/app/project/${id}`}><div className="project-visual" style={{ background: item.media?.background || item.background || '#26354e' }}>{item.media?.imageUrl || item.media?.posterUrl ? <img src={item.media.imageUrl || item.media.posterUrl} alt="" /> : <span>{(titleFor(item).slice(0, 1) || 'G').toUpperCase()}</span>}</div><div><small>{item.type || item.media?.kind || 'Project'}</small><h3>{titleFor(item)}</h3><p>{creatorFor(item)}</p></div></Link> }

export function HomePage() {
  const { token } = useAuth(); const [items, setItems] = useState([]); const [state, setState] = useState('loading')
  useEffect(() => { fetchFeed(token).then((data) => { setItems(data.items || data.feed || []); setState('ready') }).catch(() => setState('error')) }, [token])
  return <main className="page"><PageHeading eyebrow="YOUR FEED" title="Work worth pausing for" action={<Link className="primary-button" to="/app/explore">Explore creators</Link>} />{state === 'loading' ? <Loading /> : state === 'error' ? <Loading label="Could not load the feed. Please refresh." /> : <div className="feed-grid">{items.length ? items.map((item) => <ProjectCard key={idFor(item)} item={item} />) : <Loading label="The feed is waiting for its first project." />}</div>}</main>
}

export function ExplorePage() {
  const { token } = useAuth(); const [projects, setProjects] = useState([]); const [query, setQuery] = useState('')
  useEffect(() => { fetchProjects(token).then((data) => setProjects(Array.isArray(data) ? data : data.items || [])).catch(() => setProjects([])) }, [token])
  const results = useMemo(() => projects.filter((project) => `${titleFor(project)} ${creatorFor(project)} ${project.description || ''}`.toLowerCase().includes(query.toLowerCase())), [projects, query])
  return <main className="page"><PageHeading eyebrow="DISCOVER" title="Explore current work" /><input className="search" placeholder="Search projects and creators" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="project-grid">{results.map((project) => <ProjectCard key={idFor(project)} item={project} />)}{!results.length && <Loading label="No projects match this search yet." />}</div></main>
}

export function ProjectDetailPage() {
  const { token } = useAuth(); const { projectId } = useParams(); const toast = useToast(); const [project, setProject] = useState(null); const [busy, setBusy] = useState(false)
  useEffect(() => { fetchProject(token, projectId).then((data) => setProject(data.project || data)).catch((error) => toast.error(error.message)) }, [token, projectId, toast])
  if (!project) return <main className="page"><Loading /></main>
  const media = project.media || {}; const viewer = media.manifestUrl ? <iframe title={titleFor(project)} src={media.manifestUrl} /> : media.imageUrl || media.posterUrl ? <img src={media.imageUrl || media.posterUrl} alt={titleFor(project)} /> : <div className="project-visual large">{titleFor(project).slice(0, 1)}</div>
  const react = async () => { setBusy(true); try { await updateEngagement(token, 'project', idFor(project), { action: 'react' }); toast.success('Reaction saved.') } catch (error) { toast.error(error.message) } finally { setBusy(false) } }
  return <main className="page"><Link className="back-link" to="/app/explore">← Back to explore</Link><div className="detail-layout"><section><div className="media-viewer">{viewer}</div><small>{project.type || media.kind || 'Project'}</small><h1>{titleFor(project)}</h1><p className="description">{project.description || 'No description added yet.'}</p><button onClick={react} disabled={busy}>{busy ? 'Saving…' : 'Appreciate this work'}</button></section><aside className="detail-sidebar"><h3>Created by</h3><b>{creatorFor(project)}</b><p>{project.creator?.headline || 'GameFlow creator'}</p><h3>Tools</h3><div className="tag-list">{(project.software || project.tags || []).map((tag) => <span key={tag}>{tag}</span>) || <span>Independent work</span>}</div></aside></div></main>
}

export function UploadPage() {
  const { token } = useAuth(); const toast = useToast(); const navigate = useNavigate(); const [form, setForm] = useState({ title: '', description: '', visibility: 'public', type: 'game', category: 'Independent' }); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false)
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { const data = await createProject(token, form); const project = data.project || data; if (file) await uploadProjectFile(token, idFor(project), file); await publishProject(token, idFor(project)); toast.success('Project published.'); navigate(`/app/project/${idFor(project)}`) } catch (error) { toast.error(error.message) } finally { setBusy(false) } }
  return <main className="page"><PageHeading eyebrow="PUBLISH" title="Share a new project" /><form className="upload-form" onSubmit={submit}><label>Project title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>Project type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="game">Game</option><option value="3d">3D asset</option><option value="2d">2D artwork</option></select></label><label>Category<input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>Describe the work<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label>Visibility<select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })}><option value="public">Public</option><option value="private">Private</option></select></label><label className="file-field">Add a project file<input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />{file && <span>{file.name}</span>}</label><button className="primary-button" disabled={busy}>{busy ? 'Publishing…' : 'Publish project'}</button></form></main>
}

export function InboxPage() {
  const { token } = useAuth(); const [conversations, setConversations] = useState([]); const [active, setActive] = useState(null); const [messages, setMessages] = useState([]); const [draft, setDraft] = useState(''); const toast = useToast(); const { connectionState } = useMessagingRealtime(token, { onEvent: (name) => { if (name === 'conversation.message.created' && active) fetchMessages(token, idFor(active)).then((data) => setMessages(data.items || [])) } })
  useEffect(() => { fetchConversations(token).then((data) => { const items = data.items || []; setConversations(items); setActive(items[0] || null) }).catch((error) => toast.error(error.message)) }, [token, toast])
  useEffect(() => { if (active) fetchMessages(token, idFor(active)).then((data) => setMessages(data.items || [])).catch((error) => toast.error(error.message)) }, [token, active, toast])
  const send = async (event) => { event.preventDefault(); if (!draft.trim() || !active) return; try { await sendMessage(token, idFor(active), { body: draft.trim() }); setDraft(''); const data = await fetchMessages(token, idFor(active)); setMessages(data.items || []) } catch (error) { toast.error(error.message) } }
  return <main className="page"><PageHeading eyebrow="INBOX" title="Conversations" action={<small className="status">{connectionState}</small>} /><div className="inbox-layout"><aside className="conversation-list">{conversations.map((conversation) => <button key={idFor(conversation)} className={active && idFor(active) === idFor(conversation) ? 'active' : ''} onClick={() => setActive(conversation)}><b>{conversation.title || conversation.otherParticipant?.name || 'Conversation'}</b><span>{conversation.lastMessage?.body || 'No messages yet'}</span></button>)}{!conversations.length && <Loading label="No conversations yet." />}</aside><section className="message-pane">{active ? <><header><b>{active.title || active.otherParticipant?.name || 'Conversation'}</b></header><div className="messages">{messages.map((message) => <p key={idFor(message)} className={message.senderId === token ? 'mine' : ''}>{message.body || message.text}</p>)}</div><form onSubmit={send}><input placeholder="Write a message" value={draft} onChange={(event) => setDraft(event.target.value)} /><button>Send</button></form></> : <Loading label="Choose a conversation to start." />}</section></div></main>
}

export function ProfilePage() {
  const { user } = useAuth(); return <main className="page"><PageHeading eyebrow="PROFILE" title="Your creative profile" /><section className="profile-card"><div className="avatar">{(user?.name || user?.username || 'G').slice(0, 1)}</div><div><h2>{user?.name || user?.username}</h2><p>@{user?.username}</p><p>{user?.headline || 'Tell the GameFlow community what you create.'}</p></div><Link className="primary-button" to="/app/upload">Publish work</Link></section><div className="profile-stats"><div><b>—</b><span>Projects</span></div><div><b>—</b><span>Followers</span></div><div><b>—</b><span>Following</span></div></div></main>
}
