// backend/src/socket/emitter.ts
// Decoupled emitter so routes can push events to connected sockets.

import type { Server as IOServer } from 'socket.io';

let io: IOServer | null = null;

export function setIO(server: IOServer) {
  io = server;
}

export function emitToUser(userId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function broadcast(event: string, payload: any) {
  if (!io) return;
  io.emit(event, payload);
}
