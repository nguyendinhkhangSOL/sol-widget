// ============================================================
// LÁT 1 — API HỒ SƠ CHUNG · khung NHÁP cho dev (Toàn Trình U40–60)
// Tham khảo — dev chỉnh cho khớp middleware/utils thực tế.
// Khớp style repo: Express Router · prisma từ ../utils/db · zod · requireAuth.
// Đăng ký ở app: app.use('/api/profile', jobProfileRouter)
// Cần: đã chạy LAT1 migration (job_profiles, profile_fields, profile_skills, data_consents)
//       + LAT1-field-dictionary.json (import làm nguồn khởi tạo).
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import fieldDict from '../data/lat1-field-dictionary.json'; // đặt file JSON vào src/data/

export const jobProfileRouter = Router();
jobProfileRouter.use(requireAuth);

// Khởi tạo hồ sơ + 15 ô 4 khối (idempotent). Ô CV lấp được → source=CV/CHUA_XAC_NHAN, còn lại CON_TRONG.
async function getOrCreateProfile(userId: string) {
  let profile = await prisma.jobProfile.findUnique({
    where: { userId },
    include: { fields: true, skills: true },
  });
  if (!profile) {
    profile = await prisma.jobProfile.create({ data: { userId } , include: { fields: true, skills: true }});
    await prisma.profileField.createMany({
      data: (fieldDict as any).fields.map((f: any) => ({
        profileId: profile!.id,
        fieldCode: f.field_code,
        blockNo:   f.block_no,
        source:    f.cv_lap ? 'CV' : null,
        status:    f.cv_lap ? 'CHUA_XAC_NHAN' : 'CON_TRONG',
      })),
      skipDuplicates: true,
    });
    profile = await prisma.jobProfile.findUnique({
      where: { userId }, include: { fields: true, skills: true },
    });
  }
  return profile!;
}

// ── GET /api/profile ─ trả hồ sơ (4 khối + kỹ năng), gom theo khối ──
jobProfileRouter.get('/', async (req: any, res, next) => {
  try {
    const profile = await getOrCreateProfile(req.user.userId);
    const khoi: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const f of profile.fields) khoi[f.blockNo]?.push(f);
    res.json({
      id: profile.id,
      targetTitle: profile.targetTitle,
      khoi,                       // { 1:[...], 2:[...], 3:[...], 4:[...] } — mỗi ô có source+status
      skills: profile.skills,     // [{ skillCode, source, status }]
    });
  } catch (e) { next(e); }
});

// ── PUT /api/profile/field ─ cập nhật 1 ô (không hỏi lại thứ đã biết) ──
const fieldSchema = z.object({
  fieldCode: z.string(),
  value:     z.string().nullable().optional(),
  source:    z.enum(['CV','PHONG_VAN','BAI_TEST','KHACH_KHAI','HE_SUY_RA']).optional(),
  status:    z.enum(['DA_XAC_NHAN','CHUA_XAC_NHAN','CON_TRONG']).optional(),
});
jobProfileRouter.put('/field', async (req: any, res, next) => {
  try {
    const body = fieldSchema.parse(req.body);
    const dictItem = (fieldDict as any).fields.find((f: any) => f.field_code === body.fieldCode);
    if (!dictItem) throw new AppError(400, 'Mã trường không hợp lệ');
    const profile = await getOrCreateProfile(req.user.userId);
    const field = await prisma.profileField.upsert({
      where: { profileId_fieldCode: { profileId: profile.id, fieldCode: body.fieldCode } },
      update: { value: body.value, source: body.source, status: body.status ?? 'DA_XAC_NHAN' },
      create: { profileId: profile.id, fieldCode: body.fieldCode, blockNo: dictItem.block_no,
                value: body.value, source: body.source ?? 'KHACH_KHAI', status: body.status ?? 'DA_XAC_NHAN' },
    });
    res.json(field);
  } catch (e) { next(e); }
});

// ── POST /api/profile/skill ─ gắn mã kỹ năng (KN.*) ──
const skillSchema = z.object({
  skillCode: z.string().regex(/^KN\./, 'Phải là mã KN.*'),
  source:    z.enum(['CV','PHONG_VAN','BAI_TEST','KHACH_KHAI','HE_SUY_RA']).optional(),
  status:    z.enum(['DA_XAC_NHAN','CHUA_XAC_NHAN','CON_TRONG']).optional(),
});
jobProfileRouter.post('/skill', async (req: any, res, next) => {
  try {
    const body = skillSchema.parse(req.body);
    const profile = await getOrCreateProfile(req.user.userId);
    const skill = await prisma.profileSkill.upsert({
      where: { profileId_skillCode: { profileId: profile.id, skillCode: body.skillCode } },
      update: { source: body.source, status: body.status ?? 'DA_XAC_NHAN' },
      create: { profileId: profile.id, skillCode: body.skillCode,
                source: body.source ?? 'KHACH_KHAI', status: body.status ?? 'DA_XAC_NHAN' },
    });
    res.json(skill);
  } catch (e) { next(e); }
});

// ── POST /api/profile/consent ─ đồng ý dữ liệu (mỗi loại 1 dòng, có bằng chứng) ──
const consentSchema = z.object({
  kind:    z.enum(['CV_READ','VOICE','LABAN_TRANSFER']),
  granted: z.boolean(),
  text:    z.string().optional(),   // nguyên văn câu đồng ý đã hiện (lưu bằng chứng)
});
jobProfileRouter.post('/consent', async (req: any, res, next) => {
  try {
    const body = consentSchema.parse(req.body);
    const now = new Date();
    const consent = await prisma.dataConsent.upsert({
      where: { userId_kind: { userId: req.user.userId, kind: body.kind } },
      update: { granted: body.granted,
                grantedAt: body.granted ? now : undefined,
                revokedAt: body.granted ? null  : now,
                evidence: { at: now.toISOString(), text: body.text ?? null } },
      create: { userId: req.user.userId, kind: body.kind, granted: body.granted,
                grantedAt: body.granted ? now : null,
                evidence: { at: now.toISOString(), text: body.text ?? null } },
    });
    res.json(consent);
  } catch (e) { next(e); }
});

// ── DELETE /api/profile ─ XOÁ THẬT (cascade job_profiles→fields/skills) ──
// Lưu ý: brief mục 6 "nút xoá chạy thật". Cân nhắc xoá kèm data_consents nếu khách muốn xoá sạch.
jobProfileRouter.delete('/', async (req: any, res, next) => {
  try {
    await prisma.jobProfile.deleteMany({ where: { userId: req.user.userId } }); // cascade
    // (tuỳ chọn) xoá luôn đồng ý dữ liệu:
    // await prisma.dataConsent.deleteMany({ where: { userId: req.user.userId } });
    res.json({ ok: true, message: 'Đã xoá hồ sơ (thật).' });
  } catch (e) { next(e); }
});
