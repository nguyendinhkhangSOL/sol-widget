/**
 * Public API: /api/directions
 * ─────────────────────────────────────────
 * Frontend consumer: buoc3.html (la-ban-huong-di)
 * - GET  /api/directions            → list all published directions
 * - GET  /api/directions/:slug      → detail 1 direction by slug
 * - POST /api/directions/match      → server-side matching P1+P2 (reuse admin logic)
 *
 * File: /var/www/huongdi/backend/src/routes/directions.ts
 */
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { optionalAuth } from '../middleware/auth';

export const directionsRouter = Router();

// ═══════════════════════════════════════════════════════════════
// GET /api/directions — List all published directions
// Query: ?category=CHUYEN_MON (optional filter)
// ═══════════════════════════════════════════════════════════════
directionsRouter.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;

    const where: any = { status: 'PUBLISHED' };
    if (category) where.category = String(category);

    const directions = await prisma.direction.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        category: true,
        confidence: true,
        sortOrder: true,
        // Vectors (needed for client-side matching if no P1/P2)
        vpPeople: true,
        vpExpert: true,
        vpBuilder: true,
        vpIndependent: true,
        vrCapital: true,
        vrTime: true,
        vrTech: true,
        vrNetwork: true,
        vrRisk: true,
        vrEnergy: true,
        vbIncomeSpeed: true,
        vbIncomePot: true,
        vbScalability: true,
        vbAiLeverage: true,
        vsExpLeverage: true,
        vsRelLeverage: true,
        vsLearningDiff: true,
        vsHealthReq: true,
        // Content
        description: true,
        whyFit: true,
        barriers: true,
        solArticleUrl: true,
        ebookUrl: true,
        roadmap30: true,
        roadmap90: true,
        roadmap180: true,
        // Meta
        publishedAt: true,
      },
    });

    res.json({
      count: directions.length,
      data: directions,
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/directions/:slug — Detail 1 direction
// ═══════════════════════════════════════════════════════════════
directionsRouter.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const direction = await prisma.direction.findUnique({
      where: { slug },
      include: {
        caseStudies: {
          where: { status: 'PUBLISHED' } as any,
          orderBy: { publishedAt: 'desc' as any },
        } as any,
      } as any,
    });

    if (!direction || direction.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Direction not found' });
    }

    res.json(direction);
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /api/directions/match — Server-side matching P1+P2 → top N
// Body: { p1: {people,expert,builder,independent}, p2: {experience,capital,...}, incomeGoal }
// ═══════════════════════════════════════════════════════════════
const MatchSchema = z.object({
  p1: z.object({
    people: z.number().min(0).max(100),
    expert: z.number().min(0).max(100),
    builder: z.number().min(0).max(100),
    independent: z.number().min(0).max(100),
  }),
  p2: z.object({
    experience: z.number().min(0).max(100),
    capital: z.number().min(0).max(100),
    time: z.number().min(0).max(100),
    technology: z.number().min(0).max(100),
    network: z.number().min(0).max(100),
    risk: z.number().min(0).max(100),
    energy: z.number().min(0).max(100),
  }),
  incomeGoal: z.string().optional(),
  limit: z.number().min(1).max(37).default(10),
});

directionsRouter.post('/match', optionalAuth, async (req, res, next) => {
  try {
    const body = MatchSchema.parse(req.body);
    const { p1, p2, limit } = body;

    const directions = await prisma.direction.findMany({
      where: { status: 'PUBLISHED' } as any,
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        category: true,
        vpPeople: true,
        vpExpert: true,
        vpBuilder: true,
        vpIndependent: true,
        vrCapital: true,
        vrTime: true,
        vrTech: true,
        vrNetwork: true,
        vrRisk: true,
        vrEnergy: true,
        vbIncomeSpeed: true,
        vbIncomePot: true,
        vbScalability: true,
        vbAiLeverage: true,
        vsExpLeverage: true,
        vsRelLeverage: true,
        vsLearningDiff: true,
        vsHealthReq: true,
        description: true,
        whyFit: true,
      },
    });

    // ─── Scoring ───────────────────────────────────────────
    const scored = directions.map((d: any) => {
      // pMatch: how well user P1 matches direction VP requirements
      const pAxes = ['people', 'expert', 'builder', 'independent'] as const;
      let pDiff = 0;
      pAxes.forEach(axis => {
        const userScore = p1[axis];
        const dirRequired = d[`vp${axis.charAt(0).toUpperCase() + axis.slice(1)}`];
        pDiff += Math.abs(userScore - dirRequired);
      });
      const pMatch = Math.max(0, 100 - pDiff / 4);

      // rMatch: user P2 resources vs direction requirements (higher user = better)
      const rMap: Record<string, string> = {
        experience: 'vsExpLeverage', // user experience vs direction leverage
        capital: 'vrCapital',
        time: 'vrTime',
        technology: 'vrTech',
        network: 'vrNetwork',
        risk: 'vrRisk',
        energy: 'vrEnergy',
      };
      let rScore = 0;
      let rCount = 0;
      Object.entries(rMap).forEach(([userKey, dirKey]) => {
        const userVal = (p2 as any)[userKey];
        const dirReq = d[dirKey];
        if (userVal >= dirReq) {
          rScore += 100;
        } else {
          rScore += Math.max(0, (userVal / dirReq) * 100);
        }
        rCount++;
      });
      const rMatch = rCount > 0 ? rScore / rCount : 0;

      // Final: 40% p + 40% r + 20% bonus (confidence)
      const bonus = d.vbAiLeverage || 50; // Prefer AI-leveraged directions
      const total = Math.round(pMatch * 0.4 + rMatch * 0.4 + bonus * 0.2);

      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        tagline: d.tagline,
        category: d.category,
        description: d.description,
        whyFit: d.whyFit,
        matchScore: total,
        pMatch: Math.round(pMatch),
        rMatch: Math.round(rMatch),
        bonus,
      };
    });

    // Sort desc by matchScore
    scored.sort((a: any, b: any) => b.matchScore - a.matchScore);

    res.json({
      count: scored.length,
      matches: scored.slice(0, limit),
    });
  } catch (err) {
    next(err);
  }
});
