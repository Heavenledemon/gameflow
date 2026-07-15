import { useEffect } from 'react'
import { io } from 'socket.io-client'

function socketUrl() {
  const base = import.meta.env.VITE_API_BASE_URL
  if (!base || !base.startsWith('http')) return window.location.origin
  try { return new URL(base).origin } catch { return window.location.origin }
}

export function useMessagingRealtime(token, { onRefresh, onEvent } = {}) {
  useEffect(() => {
    if (!token) return undefined
    const socket = io(socketUrl(), { auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 10 })
    const refresh = () => onRefresh?.()
    socket.on('realtime.ready', refresh)
    socket.on('reconnect', refresh)
    for (const eventName of ['collaboration.request.created', 'collaboration.request.updated', 'conversation.message.created', 'conversation.read.updated', 'project.member.added', 'project.member.updated']) socket.on(eventName, (event) => { onEvent?.(eventName, event); refresh() })
    return () => socket.disconnect()
  }, [onEvent, onRefresh, token])
}
