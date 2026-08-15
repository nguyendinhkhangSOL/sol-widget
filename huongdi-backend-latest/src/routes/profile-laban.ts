// ============================================================
// LÁT 6 — API BÀN GIAO → LA BÀN SOL (Hướng 2) · khung NHÁP + HÀM MAP THẬT
// Style repo: Express + prisma + zod + requireAuth.
// Cần: Lát 1 (profile_skills), bảng `models` (skill_codes/von_can/dia_ban đã gắn 14/08),
//      Lát 6 migration.
// Gắn: app.use('/api/profile/laban', labanRouter)
// ============================================================

import { Router } from 'express';
import { prisma } from '../utils/db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const labanRouter = Router();
labanRouter.use(requireAuth);

// skill_codes có thể lưu dạng text[] / jsonb / chuỗi phẩy — chuẩn hoá về mảng.
function toCodes(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    const s = v.trim();
    if (s.startsWith('[')) { try { return JSON.parse(s).map(String); } catch { /* fallthrough */ } }
    return s.replace(/[{}]/g, '').split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

// ── HÀM MAP: kỹ năng hồ sơ × skill_codes mô hình → điểm khớp ──
export function mapProfileToModels(
  have: Set<string>,
  models: Array<{ mh_id: string; ten: string; skill_codes: any; von_can?: string; dia_ban?: string }>,
) {
  const scored = models.map((m) => {
    const codes = toCodes(m.skill_codes);
    const khop = codes.filter((c) => have.has(c));
    // điểm = tỉ lệ mã mô hình mà khách có (ưu tiên mô hình khách phủ được nhiều)
    const diem = codes.length ? Math.round((khop.length / codes.length) * 100) : 0;
    return { mh_id: m.mh_id, ten: m.ten, diem, ky_nang_khop: khop, von_can: m.von_can ?? null, dia_ban: m.dia_ban ?? null };
  });
  return scored.filter((x) => x.diem > 0).sort((a, b) => b.diem - a.diem);
}

// ── POST /api/profile/laban/run ─ chạy MAP, KHÔNG hỏi lại ──
labanRouter.post('/run', async (req: any, res, next) => {
  try {
    const p = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId }, include: { skills: true } });
    if (!p) throw new AppError(400, 'Chưa có hồ sơ — làm Hướng 1 trước');
    if (p.skills.length === 0) throw new AppError(400, 'Hồ sơ chưa có kỹ năng nào — khai thêm để La Bàn gợi ý được');

    // (Tuỳ chính sách) nếu coi Hướng 2 là mục đích khác → yêu cầu đồng ý chuyển:
    // const c = await prisma.dataConsent.findFirst({ where: { userId: req.user.userId, kind: 'LABAN_TRANSFER', revokedAt: null } });
    // if (!c) throw new AppError(403, 'Cần đồng ý dùng hồ sơ cho La Bàn Sol');

    // Đọc THẲNG bảng models đã gắn mã (dev chỉnh tên cột cho khớp schema thật).
    const models: any[] = await prisma.$queryRawUnsafe(
      `SELECT mh_id, name AS ten, skill_codes, von_can, dia_ban
         FROM models
        WHERE skill_codes IS NOT NULL
          AND (status IS NULL OR status <> 'archived')`,
    );

    const have = new Set(p.skills.map((s) => s.skillCode));
    const results = mapProfileToModels(have, models);
    const top = results.slice(0, 5); // FE hiện Top 5 hướng hợp

    const run = await prisma.modelMatchRun.create({
      data: { profileId: p.id, results: top, topMhId: top[0]?.mh_id ?? null },
    });
    res.json({ runId: run.id, top }); // mỗi mục: {mh_id, ten, diem, ky_nang_khop, von_can, dia_ban}
  } catch (e) { next(e); }
});

// ── GET /api/profile/laban/runs ─ xem các lần map trước ──
labanRouter.get('/runs', async (req: any, res, next) => {
  try {
    const p = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId } });
    if (!p) throw new AppError(400, 'Chưa có hồ sơ');
    const runs = await prisma.modelMatchRun.findMany({ where: { profileId: p.id }, orderBy: { createdAt: 'desc' } });
    res.json(runs);
  } catch (e) { next(e); }
});
