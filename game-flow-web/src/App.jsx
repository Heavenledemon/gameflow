import { Link, Route, Routes } from 'react-router-dom'

function PlaceholderPage({ title }) {
  return <main><h1>{title}</h1><p>The desktop experience will be delivered in Phase 3.</p></main>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PlaceholderPage title="GameFlow Web" />} />
      <Route path="/app/*" element={<PlaceholderPage title="GameFlow Web" />} />
      <Route path="*" element={<main><h1>Page not found</h1><Link to="/">Return home</Link></main>} />
    </Routes>
  )
}
