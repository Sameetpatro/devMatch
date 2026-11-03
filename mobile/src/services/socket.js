import { io } from 'socket.io-client';
import { CONFIG } from '../config';
import { storage } from './api';

let socketInstance = null;

export async function getMobileSocket() {
  const token = await storage.getToken();
  if (!token) return null;

  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  socketInstance = io(CONFIG.WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
  });

  socketInstance.on('connect', () => {
    console.log('[Mobile WS] Connected to devMatch server');
  });

  socketInstance.on('connect_error', (err) => {
    console.warn(`[Mobile WS] Connection error: ${err.message}`);
  });

  return socketInstance;
}

export function closeMobileSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

