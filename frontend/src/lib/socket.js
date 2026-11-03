import { io } from 'socket.io-client';
import { tokenStore } from './api';

let socket = null;

export function getSocket() {
  const token = tokenStore.get();
  if (!token) return null;

  if (socket) {
    return socket;
  }

  // Derive WebSocket server URL (defaults to localhost:5001 in dev)
  let wsUrl = import.meta.env.VITE_WS_URL;
  if (!wsUrl) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      wsUrl = 'http://localhost:5001';
    } else {
      wsUrl = window.location.origin;
    }
  }

  socket = io(wsUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[devMatch WS] Connected to live chat server');
  });

  socket.on('connect_error', (err) => {
    console.warn(`[devMatch WS] Connection warning: ${err.message}`);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

