import { Component } from 'react'

export default class ErrorReportingBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() { return { hasError: true } }

  componentDidCatch(error, errorInfo) {
    const detail = { message: error?.message ?? 'Unknown client error', componentStack: errorInfo?.componentStack ?? '', release: import.meta.env.VITE_RELEASE_VERSION ?? 'development', browser: navigator.userAgent }
    window.dispatchEvent(new CustomEvent('gameflow:client-error', { detail }))
    console.error('gameflow_client_error', detail)
  }

  render() {
    if (this.state.hasError) return <main role="alert"><h1>Something went wrong</h1><p>Please refresh and try again.</p></main>
    return this.props.children
  }
}
