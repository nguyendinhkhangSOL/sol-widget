// ═══════════════════════════════════════════════════════════════
// BATCH B — Extend /api/admin/users with filter + search + detail
// PATCH file: /var/www/huongdi/backend/src/routes/admin.ts
// Replace old GET /users handler with this version + ADD GET /users/:id
// ═══════════════════════════════════════════════════════════════

// ─── REPLACE existing adminRouter.get('/users', ...) ─────────
adminRouter.get('/users', async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const tier = req.query.tier as string | undefined;
    const search = (req.query.search as string || '').trim();

    const where: any = {};
    if (tier && ['FREE', 'ACTIVE', 'FOUNDER', 'EXPIRED'].includes(tier)) {
      where.tier = tier;
    }
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total, tierCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          email: true,
          zaloId: true,
          phone: true,
          displayName: true,
          avatarUrl: true,
          tier: true,
          tierStartedAt: true,
          tierExpiresAt: true,
          activeLeadId: true,
          role: true,
          isActive: true,
          lastSeenAt: true,
          createdAt: true,
          _count: {
            select: {
              p1Results: true,
              p2Results: true,
              savedDirs: true,
              outcomes: true,
              events: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({ by: ['tier'], _count: true }),
    ]);

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
      tierCounts,
    });
  } catch (err) {
    next(err);
  }
});

// ─── NEW: GET /api/admin/users/:id — Detail ─────────────────
adminRouter.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      include: {
        activeLead: true,
        p1Results: { orderBy: { createdAt: 'desc' }, take: 10 },
        p2Results: { orderBy: { createdAt: 'desc' }, take: 10 },
        savedDirs: {
          orderBy: { createdAt: 'desc' },
          include: {
            direction: {
              select: { id: true, name: true, slug: true, category: true, tagline: true },
            },
          },
        },
        outcomes: {
          orderBy: { createdAt: 'desc' },
          include: {
            direction: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── NEW: PATCH /api/admin/users/:id/tier — Manual tier update ─
adminRouter.patch('/users/:id/tier', requireSuperAdmin, async (req, res, next) => {
  try {
    const { tier, tierExpiresAt } = z.object({
      tier: z.enum(['FREE', 'ACTIVE', 'FOUNDER', 'EXPIRED']),
      tierExpiresAt: z.string().datetime().optional(),
    }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: {
        tier: tier as any,
        tierStartedAt: new Date(),
        tierExpiresAt: tierExpiresAt ? new Date(tierExpiresAt) : null,
      },
    });

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── NEW: GET /api/admin/sessions — Anonymous sessions ──────
// P1/P2 results với userId = null → sessions chưa đăng ký
adminRouter.get('/sessions', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);

    // Aggregate anonymous sessions từ p1_results + p2_results
    const p1Sessions = await prisma.p1Result.findMany({
      where: { userId: null },
      select: { sessionId: true, createdAt: true, people: true, expert: true, builder: true, independent: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const p2Sessions = await prisma.p2Result.findMany({
      where: { userId: null },
      select: { sessionId: true, createdAt: true, experience: true, capital: true, incomeGoal: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Merge by sessionId
    const merged = new Map<string, any>();

    p1Sessions.forEach(p1 => {
      merged.set(p1.sessionId, {
        sessionId: p1.sessionId,
        p1: p1,
        p2: null,
        latestActivity: p1.createdAt,
      });
    });

    p2Sessions.forEach(p2 => {
      const existing = merged.get(p2.sessionId);
      if (existing) {
        existing.p2 = p2;
        if (p2.createdAt > existing.latestActivity) {
          existing.latestActivity = p2.createdAt;
        }
      } else {
        merged.set(p2.sessionId, {
          sessionId: p2.sessionId,
          p1: null,
          p2: p2,
          latestActivity: p2.createdAt,
        });
      }
    });

    const sessions = Array.from(merged.values()).sort((a, b) =>
      new Date(b.latestActivity).getTime() - new Date(a.latestActivity).getTime()
    );

    res.json({
      total: sessions.length,
      sessions: sessions.slice(0, limit),
    });
  } catch (err) {
    next(err);
  }
});
