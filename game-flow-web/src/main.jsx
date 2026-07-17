import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import ErrorReportingBoundary from './components/ErrorReportingBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorReportingBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter basename="/web"><App /></BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorReportingBoundary>
  </StrictMode>,
)
