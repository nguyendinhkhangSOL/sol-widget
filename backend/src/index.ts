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
// Silent Companionship channels (pivot 2026-05-08)
import confessionsRouter from './confessions/routes';
import khangQuestionsRouter from './khangQuestions/routes';
import voicesRouter from './voices/routes';
import lapseRouter from './lapse/routes';
import crisisTimerRouter from './crisisTimer/routes';
import statsRouter from './stats/routes';
// Zalo OA — Sol v3 (12-05-2026): webhook + ZNS + admin endpoints
import { zaloRouter } from './zalo/routes';
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
// Dev mode: relaxed cho test thoải mái. Prod: strict chống brute-force.
const isDev = process.env.NODE_ENV !== 'production';
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 20, // Dev: 500/15p · Prod: 20/15p
  skipSuccessfulRequests: isDev, // Dev: chỉ count fail; Prod: count tất
});
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
// Silent Companionship channels — 7 kênh thay group truyền thống
app.use('/confessions', confessionsRouter);
app.use('/khang-questions', khangQuestionsRouter);
app.use('/voices', voicesRouter);
app.use('/lapse', lapseRouter);
app.use('/crisis-timer', crisisTimerRouter);
app.use('/stats', statsRouter);
// Zalo OA — webhook + admin endpoints. KHÔNG có authLimiter cho /webhook
// (vì Zalo gọi thẳng, không có JWT). Signature verify trong handler.
app.use('/api/zalo', zaloRouter);
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
