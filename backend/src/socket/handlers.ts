// backend/src/socket/handlers.ts
import type { Server as IOServer } from 'socket.io';
import { verifyToken } from '../auth/middleware';
import { prisma } from '../db';
import { dispatchMessage } from '../state/machine';
import { logger } from '../utils/logger';
import { setIO } from './emitter';

export function registerSocketHandlers(io: IOServer) {
  setIO(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('missing_token'));
    }
    const userId = verifyToken(token);
    if (!userId) return next(new Error('invalid_token'));
    (socket.data as any).userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as any).userId as string;
    socket.join(`user:${userId}`);
    logger.info({ userId, socketId: socket.id }, 'socket connected');

    // Allow user to send messages over socket (faster than HTTP).
    socket.on('message:send', async (payload, ack) => {
      try {
        const content = String(payload?.content ?? '').slice(0, 2000);
        const metadata = payload?.metadata ?? {};
        if (!content) return ack?.({ ok: false, error: 'empty_message' });

        const userMsg = await prisma.message.create({
          data: {
            userId,
            role: 'USER',
            type: metadata?.type ?? 'CHAT',
            content,
            metadata,
          },
        });
        socket.emit('message:new', userMsg);

        const result = await dispatchMessage(userId, content, metadata);

        for (const out of result.outbound) {
          const saved = await prisma.message.create({
            data: {
              userId,
              role: 'ASSISTANT',
              type: out.type,
              content: out.content,
              metadata: out.metadata ?? {},
            },
          });
          socket.emit('message:new', saved);
        }

        socket.emit('state:change', { state: result.newState });
        ack?.({ ok: true });
      } catch (err) {
        logger.error({ err, userId }, 'socket message:send error');
        ack?.({ ok: false, error: 'server_error' });
      }
    });

    // Client can mark messages as read in bulk.
    socket.on('message:read', async (payload) => {
      const ids = Array.isArray(payload?.ids) ? payload.ids.map(String) : [];
      if (ids.length === 0) return;
      await prisma.message.updateMany({
        where: { userId, id: { in: ids }, readAt: null },
        data: { readAt: new Date() },
      });
    });

    // Typing indicator passthrough (no-op server-side for now).
    socket.on('typing', () => {
      // Reserved for future multi-device sync.
    });

    socket.on('disconnect', () => {
      logger.debug({ userId }, 'socket disconnected');
    });
  });
}
