// frontend/src/services/socket.ts
// Single Socket.IO client, lazily connected.

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(baseUrl: string, token: string): Socket {
  if (socket?.connected) return socket;
  socket?.disconnect();
  socket = io(baseUrl, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
