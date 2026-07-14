import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) {
    return window.location.origin;
  }
  if (envUrl.startsWith('http')) {
    try {
      const u = new URL(envUrl);
      return u.origin;
    } catch (e) {
      return envUrl;
    }
  }
  return window.location.origin;
};

export function useProjectRealtime(projectId, token, { onEngagementUpdated, onReconnected }) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect only for authenticated users (when token is provided)
    if (!projectId || !token) return;

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Realtime socket connected');
      socket.emit('join_project', { projectId });
    });

    socket.on('realtime.ready', () => {
      console.log('Realtime socket ready');
      if (onReconnected) onReconnected();
    });

    socket.on('reconnect', () => {
      console.log('Realtime socket reconnected');
      socket.emit('join_project', { projectId });
      if (onReconnected) onReconnected();
    });

    socket.on('project.engagement.updated', (data) => {
      // Check if data is for the current project
      const updatedProjectId = data?.projectId || data?.id || data?._id;
      if (String(updatedProjectId) === String(projectId)) {
        if (onEngagementUpdated) {
          onEngagementUpdated(data);
        }
      }
    });

    socket.on('connect_error', (error) => {
      console.warn('Realtime connection error (non-blocking):', error);
    });

    return () => {
      if (socket) {
        socket.emit('leave_project', { projectId });
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [projectId, token, onEngagementUpdated, onReconnected]);

  return socketRef;
}
