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

function notifyConnection(nextState) {
  sharedState = nextState
  subscribers.forEach((subscriber) => subscriber.connection?.(nextState))
}

function notifyEvent(eventName, event) {
  subscribers.forEach((subscriber) => subscriber.event?.(eventName, event))
}

function notifyReady(event) {
  subscribers.forEach((subscriber) => subscriber.ready?.(event))
}

function ensureSocket(token) {
  if (sharedSocket && sharedToken === token) return sharedSocket
  sharedSocket?.disconnect()
  sharedToken = token
  sharedSocket = io(socketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 750,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  })
  notifyConnection('connecting')
  sharedSocket.on('connect', () => notifyConnection('connected'))
  sharedSocket.on('disconnect', () => notifyConnection('reconnecting'))
  sharedSocket.on('connect_error', () => notifyConnection('reconnecting'))
  sharedSocket.on('realtime.ready', (event) => { notifyConnection('connected'); notifyReady(event) })
  EVENT_NAMES.forEach((eventName) => sharedSocket.on(eventName, (event) => notifyEvent(eventName, event)))
  return sharedSocket
}

/**
 * Shares one authenticated Socket.IO connection across mounted collaboration
 * surfaces. Callback refs keep route renders from reconnecting the socket.
 */
export function useMessagingRealtime(token, { onEvent, onReady, onConnectionChange } = {}) {
  const callbacksRef = useRef({ onEvent, onReady, onConnectionChange })
  const [connectionState, setConnectionState] = useState(sharedState)

  useEffect(() => {
    callbacksRef.current = { onEvent, onReady, onConnectionChange }
  })

  useEffect(() => {
    if (!token) return undefined
    const subscriber = {
      event: (eventName, event) => callbacksRef.current.onEvent?.(eventName, event),
      ready: (event) => callbacksRef.current.onReady?.(event),
      connection: (state) => { setConnectionState(state); callbacksRef.current.onConnectionChange?.(state) },
    }
    subscribers.add(subscriber)
    ensureSocket(token)
    return () => {
      subscribers.delete(subscriber)
      if (!subscribers.size) {
        sharedSocket?.disconnect()
        sharedSocket = null
        sharedToken = ''
        sharedState = 'idle'
      }
    }
  }, [token])

  return { connectionState: token ? connectionState : 'idle' }
}
