import { Router } from 'express';
import { z } from 'zod';
import { EventType } from '@prisma/client';
import { prisma } from '../utils/db';
import { optionalAuth } from '../middleware/auth';

export const eventsRouter = Router();

const EventSchema = z.object({
  sessionId: z.string(),
  eventType: z.nativeEnum(EventType),
  directionId: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  meta: z.record(z.any()).optional(),
});

// ── POST /api/events ──────────────────────────────────────
// Fire-and-forget analytics event
eventsRouter.post('/', optionalAuth, async (req, res, next) => {
  try {
    const body = EventSchema.parse(req.body);
    await prisma.userEvent.create({
      data: {
        userId: req.user?.userId ?? null,
        sessionId: body.sessionId,
        eventType: body.eventType,
        directionId: body.directionId ?? null,
        utmSource: body.utmSource ?? null,
        utmMedium: body.utmMedium ?? null,
        utmCampaign: body.utmCampaign ?? null,
        meta: body.meta ?? undefined,
      },
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ── POST /api/events/batch ────────────────────────────────
// Send multiple events at once (for offline buffer flush)
eventsRouter.post('/batch', optionalAuth, async (req, res, next) => {
  try {
    const events = z.array(EventSchema).max(50).parse(req.body);
    await prisma.userEvent.createMany({
      data: events.map((e) => ({
        userId: req.user?.userId ?? null,
        sessionId: e.sessionId,
        eventType: e.eventType,
        directionId: e.directionId ?? null,
        utmSource: e.utmSource ?? null,
        utmMedium: e.utmMedium ?? null,
        utmCampaign: e.utmCampaign ?? null,
        meta: e.meta ?? undefined,
      })),
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
