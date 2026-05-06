// backend/src/index.ts
// HTTP + Socket.IO entrypoint.

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as IOServer } from 'socket.io';

import { config } from './config';
import { logger } from './utils/logger';
import { initSentry, sentryErrorHandler, captureError } from './utils/sentry';

// Init Sentry SỚM NHẤT — phải trước khi app/socket bắt đầu listen.
initSentry();
import { authRouter } from './auth/routes';
import { emailAuthRouter } from './auth/email/routes';
import { usersRouter } from './users/routes';
import { notificationPrefsRouter } from './users/notificationPrefs';
import { journeyRouter } from './journey/routes';
import { messagesRouter } from './messages/routes';
import { checkinsRouter } from './checkins/routes';
import { exercisesRouter } from './exercises/routes';
import { contentRouter } from './content/routes';
import { notificationsRouter } from './notifications/routes';
import { adminRouter } from './admin/routes';
import { tiersRouter } from './tiers/routes';
import { paymentsRouter } from './payments/routes';
import { refundsRouter } from './refunds/routes';
import { voiceRouter } from './voice/routes';
import { registerSocketHandlers } from './socket/handlers';
import { startScheduler } from './scheduler/worker';

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      if (config.env !== 'production') return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '256kb' }));

// Rate-limit auth and messaging.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const messageLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

app.get('/healthz', (_, res) => res.json({ ok: true, now: new Date().toISOString() }));

app.use('/auth', authLimiter, authRouter);
app.use('/auth/email', authLimiter, emailAuthRouter);
app.use('/users', usersRouter);
app.use('/users/me/notification-prefs', notificationPrefsRouter);
app.use('/journey', journeyRouter);
app.use('/messages', messageLimiter, messagesRouter);
app.use('/checkins', checkinsRouter);
app.use('/exercises', exercisesRouter);
app.use('/content', contentRouter);
app.use('/notifications', notificationsRouter);
app.use('/tiers', tiersRouter);
app.use('/payments', paymentsRouter);
app.use('/refunds', refundsRouter);
app.use('/voice', voiceRouter);
app.use('/admin', adminRouter);

// Sentry error handler — capture vào Sentry trước khi log ra console.
app.use(sentryErrorHandler);

// Fallback error handler — log + 500.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err: err?.message, stack: err?.stack }, 'unhandled error');
  res.status(500).json({ error: 'server_error' });
});

// Crash safety: capture unhandled rejections + uncaught exceptions.
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'unhandledRejection');
  captureError(reason, { source: 'unhandledRejection' });
});
process.on('uncaughtException', (err) => {
  logger.error({ err: err?.message, stack: err?.stack }, 'uncaughtException');
  captureError(err, { source: 'uncaughtException' });
});

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: config.corsOrigins, credentials: true },
});

registerSocketHandlers(io);

// Khi chạy test (NODE_ENV=test), KHÔNG auto-listen — supertest gắn vào
// `app` instance trực tiếp, không cần port. Cũng không khởi scheduler/socket
// để tránh leak handle giữa các test file.
if (config.env !== 'test') {
  server.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'SOL backend listening');
    startScheduler();
  });
}

export { app, server, io };
