import { useEffect, useRef, useState } from 'react'

const GOOGLE_SCRIPT_ID = 'google-identity-services'

const GoogleSignInButton = ({ onCredential, onError, disabled = false }) => {
  const containerRef = useRef(null)
  const credentialHandlerRef = useRef(onCredential)
  const errorHandlerRef = useRef(onError)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    credentialHandlerRef.current = onCredential
    errorHandlerRef.current = onError
  }, [onCredential, onError])

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    let cancelled = false

    if (!clientId) {
      errorHandlerRef.current?.('Google sign-in is not configured.')
      return undefined
    }

    const renderGoogleButton = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential) credentialHandlerRef.current?.(credential)
          else errorHandlerRef.current?.('Google did not return a sign-in credential.')
        },
      })

      containerRef.current.replaceChildren()
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width: Math.min(containerRef.current.clientWidth || 400, 400),
      })
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID)
    if (existingScript) {
      if (window.google?.accounts?.id) renderGoogleButton()
      else existingScript.addEventListener('load', renderGoogleButton, { once: true })
    } else {
      const script = document.createElement('script')
      script.id = GOOGLE_SCRIPT_ID
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.addEventListener('load', renderGoogleButton, { once: true })
      script.addEventListener('error', () => {
        errorHandlerRef.current?.('Google sign-in could not be loaded.')
      }, { once: true })
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      existingScript?.removeEventListener('load', renderGoogleButton)
    }
  }, [])

  return (
    <div
      aria-disabled={disabled}
      style={{
        width: '100%',
        minHeight: 44,
        display: 'flex',
        justifyContent: 'center',
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 'min(100%, 400px)',
          borderRadius: 20,
          position: 'relative',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 6px 20px -2px rgba(66, 133, 244, 0.35), 0 2px 8px rgba(0, 0, 0, 0.4)'
            : '0 2px 10px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            minHeight: 40,
            display: 'flex',
            justifyContent: 'center',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        />
      </div>
    </div>
  )
}

export default GoogleSignInButton
