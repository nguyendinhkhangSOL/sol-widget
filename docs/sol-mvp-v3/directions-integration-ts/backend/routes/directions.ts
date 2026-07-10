// ═══════════════════════════════════════════════════════════════
// PUBLIC API — /api/directions
// Mount: app.use('/api/directions', directionsRouter);
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/directions
// Query params:
//   ?category=chuyenmon
//   ?cluster=A
//   ?status=PUBLISHED (default)
//   ?includeUnpublished=true (admin only)
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, cluster, includeUnpublished } = req.query;

    const where: any = {};
    if (!includeUnpublished) {
      where.status = 'PUBLISHED';
    }
    if (category) where.category = category as string;
    if (cluster) where.cluster = cluster as string;

    const directions = await prisma.direction.findMany({
      where,
      orderBy: [
        { isNew: 'desc' },
        { publishedAt: 'desc' },
        { title: 'asc' },
      ],
    });

    // Backward compat: return array (not wrapped) để buoc3.html dễ migrate
    res.json({
      success: true,
      count: directions.length,
      data: directions,
    });
  } catch (err: any) {
    console.error('GET /api/directions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/directions/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const direction = await prisma.direction.findUnique({
      where: { id },
    });

    if (!direction) {
      return res.status(404).json({ success: false, error: 'Direction not found' });
    }

    if (direction.status !== 'PUBLISHED' && !req.query.includeUnpublished) {
      return res.status(404).json({ success: false, error: 'Direction not published' });
    }

    // Load related case studies
    const caseStudies = await prisma.caseStudy.findMany({
      where: {
        id: { in: direction.caseStudyIds || [] },
        status: 'PUBLISHED',
      },
    });

    res.json({
      success: true,
      data: {
        ...direction,
        caseStudies,
      },
    });
  } catch (err: any) {
    console.error(`GET /api/directions/${req.params.id} error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/directions/matches
// Body/Query:
//   p1_scores: {people, expert, builder, independent}     (từ localStorage.p1_result)
//   p2_scores: {capital, time, tech, network, risk, energy, incomeGoal}
// Response: top 10 matching direction với score breakdown
// ─────────────────────────────────────────────────────────────
router.post('/matches', async (req, res) => {
  try {
    const { p1_norm, p2_scores, incomeGoal = 10 } = req.body;

    if (!p1_norm || !p2_scores) {
      return res.status(400).json({
        success: false,
        error: 'Missing p1_norm or p2_scores',
      });
    }

    const directions = await prisma.direction.findMany({
      where: { status: 'PUBLISHED' },
    });

    // Server-side scoring (mirror buoc3.html logic)
    const scored = directions.map(dir => {
      const pFit = dir.pFit as any;
      const rReq = dir.rReq as any;
      const income = dir.income as any;

      // pMatch (DNA fit)
      const dims = ['people', 'expert', 'builder', 'independent'];
      const totP = dims.reduce((s, d) => s + (pFit[d] || 0), 0) || 1;
      let pScore = 0;
      dims.forEach(d => {
        const u = p1_norm[d] || 0;
        const req = pFit[d] || 0;
        const s = u >= req ? 100 : Math.max(0, 100 - (req - u) * 1.3);
        pScore += s * (req / totP);
      });
      pScore = Math.min(100, Math.round(pScore));

      // rMatch (resources)
      const rMap = [
        ['capital', 'capital'],
        ['time', 'time'],
        ['tech', 'tech'],
        ['network', 'network'],
        ['risk', 'risk'],
        ['energy', 'energy'],
      ];
      let rTot = 0;
      let rEx = 0;
      rMap.forEach(([pk, dk]) => {
        const u = p2_scores[pk] || 0;
        const req = rReq[dk] || 0;
        if (!req) { rTot += 100; return; }
        const s = u >= req ? 100 : Math.max(0, (u / req) * 100);
        rTot += s;
        if (u / req < 0.45 && req >= 40) rEx += 12;
      });
      const eb = ((p2_scores.exp || p2_scores.expScore || 50) - 50) / 50 * 0.7 * 18;
      const rScore = Math.max(0, Math.min(100, Math.round(rTot / rMap.length + eb - rEx)));

      // gMatch (income goal)
      const g = incomeGoal || 10;
      const mn = income.min;
      const mx = income.max;
      let gScore: number;
      if (g >= mn && g <= mx) gScore = 95;
      else if (g < mn) gScore = 82;
      else if (g <= mx * 1.5) gScore = 62;
      else gScore = 38;

      const total = Math.round((pScore * 0.4) + (rScore * 0.4) + (gScore * 0.2));

      return {
        id: dir.id,
        title: dir.title,
        emoji: dir.emoji,
        category: dir.category,
        categoryLabel: dir.categoryLabel,
        cluster: dir.cluster,
        income: dir.income,
        timeline: dir.timeline,
        totalScore: total,
        pScore,
        rScore,
        gScore,
      };
    });

    // Sort desc by totalScore
    scored.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      success: true,
      count: scored.length,
      top10: scored.slice(0, 10),
      all: scored,
    });
  } catch (err: any) {
    console.error('POST /api/directions/matches error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/directions/stats/summary
// Aggregate stats for admin dashboard
// ─────────────────────────────────────────────────────────────
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await prisma.direction.count();
    const published = await prisma.direction.count({ where: { status: 'PUBLISHED' } });
    const draft = await prisma.direction.count({ where: { status: 'DRAFT' } });

    const byCategory = await prisma.direction.groupBy({
      by: ['category'],
      _count: true,
    });

    const byCluster = await prisma.direction.groupBy({
      by: ['cluster'],
      _count: true,
    });

    res.json({
      success: true,
      data: {
        total,
        published,
        draft,
        byCategory,
        byCluster,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
