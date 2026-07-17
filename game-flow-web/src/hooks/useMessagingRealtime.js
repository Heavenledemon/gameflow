import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const EVENT_NAMES = ['collaboration.request.created', 'collaboration.request.updated', 'conversation.message.created', 'conversation.read.updated', 'project.member.added', 'project.member.updated']
const subscribers = new Set()
let sharedSocket = null
let sharedToken = ''
let sharedState = 'idle'

function socketUrl() {
  const base = import.meta.env.VITE_API_BASE_URL
  if (!base || !base.startsWith('http')) return window.location.origin
  try { return new URL(base).origin } catch { return window.location.origin }
}

function notify(kind, ...args) { subscribers.forEach((subscriber) => subscriber[kind]?.(...args)) }
function setConnectionState(state) { sharedState = state; notify('connection', state) }

function ensureSocket(token) {
  if (sharedSocket && sharedToken === token) return sharedSocket
  sharedSocket?.disconnect()
  sharedToken = token
  sharedSocket = io(socketUrl(), { auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 10 })
  setConnectionState('connecting')
  sharedSocket.on('connect', () => setConnectionState('connected'))
  sharedSocket.on('disconnect', () => setConnectionState('reconnecting'))
  sharedSocket.on('connect_error', () => setConnectionState('reconnecting'))
  sharedSocket.on('realtime.ready', (event) => { setConnectionState('connected'); notify('ready', event) })
  EVENT_NAMES.forEach((eventName) => sharedSocket.on(eventName, (event) => notify('event', eventName, event)))
  return sharedSocket
}

export function useMessagingRealtime(token, { onEvent, onReady, onConnectionChange } = {}) {
  const callbacks = useRef({ onEvent, onReady, onConnectionChange })
  const [connectionState, setConnectionState] = useState(sharedState)
  useEffect(() => { callbacks.current = { onEvent, onReady, onConnectionChange } })
  useEffect(() => {
    if (!token) return undefined
    const subscriber = {
      event: (eventName, event) => callbacks.current.onEvent?.(eventName, event),
      ready: (event) => callbacks.current.onReady?.(event),
      connection: (state) => { setConnectionState(state); callbacks.current.onConnectionChange?.(state) },
    }
    subscribers.add(subscriber)
    ensureSocket(token)
    return () => {
      subscribers.delete(subscriber)
      if (!subscribers.size) { sharedSocket?.disconnect(); sharedSocket = null; sharedToken = ''; sharedState = 'idle' }
    }
  }, [token])
  return { connectionState: token ? connectionState : 'idle' }
}
