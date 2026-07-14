import { Component } from 'react'

function reportClientError(error, errorInfo) {
  const context = {
    message: error?.message || 'Unknown client error',
    componentStack: errorInfo?.componentStack || '',
    release: import.meta.env.VITE_RELEASE_VERSION || 'development',
    browser: navigator.userAgent,
  }

  window.dispatchEvent(new CustomEvent('gameflow:client-error', { detail: context }))
  console.error('gameflow_client_error', context)
}

export default class ErrorReportingBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    reportClientError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div role="alert">Something went wrong. Please refresh and try again.</div>
    }

    return this.props.children
  }
}

