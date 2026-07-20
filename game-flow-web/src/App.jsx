import { useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { useToast } from './context/ToastContext.jsx'
import DesktopLayout from './layouts/DesktopLayout.jsx'
import { ExplorePage, HomePage, InboxPage, ProfilePage, ProjectDetailPage, UploadPage } from './pages/AppPages.jsx'
import LandingPage from './pages/LandingPage.jsx'


function AuthPage({ mode }) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn, signUp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const submit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await (mode === 'signup' ? signUp({ email, username, name, password }) : signIn({ username, password }))
      toast.success(mode === 'signup' ? 'Account created.' : 'Signed in.')
      navigate('/app/home', { replace: true })
    } catch (error) { toast.error(error.message) } finally { setIsSubmitting(false) }
  }
  return <main><h1>{mode === 'signup' ? 'Create your account' : 'Sign in'}</h1><form onSubmit={submit}>{mode === 'signup' && <><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label></>}<label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="username" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength="8" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label><button disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button></form><p><Link to={mode === 'signup' ? '/signin' : '/signup'}>{mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}</Link></p><p><a href="/m">Switch to mobile view</a></p></main>
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <main>Restoring your session…</main>
  return isAuthenticated ? children : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<AuthPage mode="signin" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route element={<ProtectedRoute><DesktopLayout /></ProtectedRoute>}>
        <Route path="/app/home" element={<HomePage />} />
        <Route path="/app/explore" element={<ExplorePage />} />
        <Route path="/app/project/:projectId" element={<ProjectDetailPage />} />
        <Route path="/app/upload" element={<UploadPage />} />
        <Route path="/app/inbox" element={<InboxPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<main><h1>Page not found</h1><Link to="/">Return home</Link></main>} />
    </Routes>
  )
}
