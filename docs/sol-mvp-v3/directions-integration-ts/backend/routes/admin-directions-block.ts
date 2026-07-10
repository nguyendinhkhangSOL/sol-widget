// ═══════════════════════════════════════════════════════════════
// ADMIN API — APPEND vào /var/www/huongdi/backend/src/routes/admin.ts
// TRƯỚC dòng `export default router;`
//
// Endpoints:
//   GET    /api/admin/directions              → list all (kể cả draft)
//   GET    /api/admin/directions/:id          → detail with revisions
//   POST   /api/admin/directions              → create
//   PUT    /api/admin/directions/:id          → update + auto-revision
//   DELETE /api/admin/directions/:id          → soft-delete (status=ARCHIVED)
//   GET    /api/admin/directions/:id/revisions → history
//   POST   /api/admin/directions/:id/revert/:versionNum → revert version
//
// Cần import ở đầu admin.ts:
//   import { PrismaClient } from '@prisma/client';
//   const prismaDirections = new PrismaClient();
// ═══════════════════════════════════════════════════════════════

// ─── LIST all directions (admin) ─────────────────────────────
router.get('/directions', async (req: any, res: any) => {
  try {
    const { category, cluster, status, q } = req.query;

    const where: any = {};
    if (category) where.category = category;
    if (cluster) where.cluster = cluster;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
        { desc: { contains: q, mode: 'insensitive' } },
      ];
    }

    const directions = await prismaDirections.direction.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        emoji: true,
        cluster: true,
        category: true,
        categoryLabel: true,
        isNew: true,
        status: true,
        version: true,
        income: true,
        timeline: true,
        publishedAt: true,
        updatedAt: true,
        lastEditedBy: true,
      },
    });

    // Summary counts
    const summary = await prismaDirections.direction.groupBy({
      by: ['status'],
      _count: true,
    });

    res.json({
      success: true,
      count: directions.length,
      data: directions,
      summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DETAIL with revisions ───────────────────────────────────
router.get('/directions/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const direction = await prismaDirections.direction.findUnique({
      where: { id },
      include: {
        revisions: {
          orderBy: { versionNum: 'desc' },
          take: 20,
        },
      },
    });

    if (!direction) {
      return res.status(404).json({ success: false, error: 'Direction not found' });
    }

    res.json({ success: true, data: direction });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── CREATE new direction ────────────────────────────────────
router.post('/directions', async (req: any, res: any) => {
  try {
    const adminUser = (req as any).user?.username || 'admin';
    const data = req.body;

    // Validate required
    if (!data.id || !data.title || !data.category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required: id, title, category',
      });
    }

    const direction = await prismaDirections.direction.create({
      data: {
        ...data,
        slug: data.slug || data.id,
        version: 1,
        lastEditedBy: adminUser,
        changeNote: data.changeNote || 'Initial creation',
      },
    });

    // Create initial revision
    await prismaDirections.directionRevision.create({
      data: {
        directionId: direction.id,
        versionNum: 1,
        snapshot: direction as any,
        editedBy: adminUser,
        changeNote: 'Initial creation',
      },
    });

    res.status(201).json({ success: true, data: direction });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Direction ID already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── UPDATE (auto-version) ───────────────────────────────────
router.put('/directions/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user?.username || 'admin';
    const { changeNote, ...updateData } = req.body;

    // Fetch current version
    const current = await prismaDirections.direction.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ success: false, error: 'Direction not found' });
    }

    const newVersion = current.version + 1;

    // Snapshot current state BEFORE update
    await prismaDirections.directionRevision.create({
      data: {
        directionId: id,
        versionNum: current.version,
        snapshot: current as any,
        editedBy: adminUser,
        changeNote: changeNote || `Backup before v${newVersion}`,
      },
    });

    // Update
    const updated = await prismaDirections.direction.update({
      where: { id },
      data: {
        ...updateData,
        version: newVersion,
        lastEditedBy: adminUser,
        changeNote: changeNote || null,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SOFT-DELETE (status = ARCHIVED) ─────────────────────────
router.delete('/directions/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user?.username || 'admin';

    const updated = await prismaDirections.direction.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        lastEditedBy: adminUser,
        changeNote: `Archived by ${adminUser}`,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── REVISIONS list ──────────────────────────────────────────
router.get('/directions/:id/revisions', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const revisions = await prismaDirections.directionRevision.findMany({
      where: { directionId: id },
      orderBy: { versionNum: 'desc' },
    });

    res.json({ success: true, count: revisions.length, data: revisions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── REVERT to previous version ──────────────────────────────
router.post('/directions/:id/revert/:versionNum', async (req: any, res: any) => {
  try {
    const { id, versionNum } = req.params;
    const adminUser = (req as any).user?.username || 'admin';

    const revision = await prismaDirections.directionRevision.findFirst({
      where: {
        directionId: id,
        versionNum: parseInt(versionNum, 10),
      },
    });

    if (!revision) {
      return res.status(404).json({ success: false, error: 'Revision not found' });
    }

    const current = await prismaDirections.direction.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ success: false, error: 'Direction not found' });
    }

    // Snapshot current before revert
    await prismaDirections.directionRevision.create({
      data: {
        directionId: id,
        versionNum: current.version,
        snapshot: current as any,
        editedBy: adminUser,
        changeNote: `Backup before revert to v${versionNum}`,
      },
    });

    // Apply revision snapshot
    const snapshot = revision.snapshot as any;
    const { id: _, createdAt, updatedAt, version, ...restoreData } = snapshot;

    const restored = await prismaDirections.direction.update({
      where: { id },
      data: {
        ...restoreData,
        version: current.version + 1,
        lastEditedBy: adminUser,
        changeNote: `Reverted to v${versionNum}`,
      },
    });

    res.json({ success: true, data: restored });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// CASE STUDIES admin endpoints
// ═══════════════════════════════════════════════════════════════

router.get('/case-studies', async (req: any, res: any) => {
  try {
    const { directionId, tier, status } = req.query;

    const where: any = {};
    if (directionId) where.directionId = directionId;
    if (tier) where.tier = tier;
    if (status) where.status = status;

    const caseStudies = await prismaDirections.caseStudy.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
    });

    res.json({ success: true, count: caseStudies.length, data: caseStudies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/case-studies/:id', async (req: any, res: any) => {
  try {
    const caseStudy = await prismaDirections.caseStudy.findUnique({
      where: { id: req.params.id },
    });
    if (!caseStudy) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }
    res.json({ success: true, data: caseStudy });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/case-studies', async (req: any, res: any) => {
  try {
    const data = req.body;
    if (!data.id || !data.personaName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required: id, personaName',
      });
    }

    const caseStudy = await prismaDirections.caseStudy.create({ data });
    res.status(201).json({ success: true, data: caseStudy });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Case study ID already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/case-studies/:id', async (req: any, res: any) => {
  try {
    const updated = await prismaDirections.caseStudy.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/case-studies/:id', async (req: any, res: any) => {
  try {
    const updated = await prismaDirections.caseStudy.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
