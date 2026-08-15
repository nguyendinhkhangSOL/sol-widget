// ============================================================
// LÁT 3 — API CỬA B · dựng hồ sơ bằng HỎI–ĐÁP → XUẤT CV
// Khung NHÁP cho dev. Style repo: Express + prisma + zod + requireAuth.
// Cần: Lát 1 (profile_fields/skills, data_consents) + Lát 2 (cv_documents) + Lát 3 migration.
// Data: lat3-questions.json + seed-chuan-sol.json (jd_tu_khoa_map để rút kỹ năng).
// Gắn: app.use('/api/profile/build', buildRouter)
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import QS from '../data/lat3-questions.json';
import seed from '../data/seed-chuan-sol.json';

export const buildRouter = Router();
buildRouter.use(requireAuth);

const QUESTIONS: any[] = (QS as any).questions;
const byCode = (c: string) => QUESTIONS.find((q) => q.code === c);

// Bản đồ từ khoá → mã (cụm dài ưu tiên) — dùng để GỢI Ý từ câu kể chuyện.
const KW: Array<[string, string]> = (seed as any).jd_tu_khoa_map
  .map((x: any) => [x.tu_khoa.toLowerCase(), x.ma] as [string, string])
  .sort((a: any, b: any) => b[0].length - a[0].length);

function goiYtuChuyen(text: string) {
  const low = ' ' + text.toLowerCase() + ' ';
  const out: Array<{ code: string; tu_khoa: string }> = [];
  const seen = new Set<string>();
  for (const [kw, code] of KW)
    if (low.includes(kw) && code.startsWith('KN.') && !seen.has(code)) { seen.add(code); out.push({ code, tu_khoa: kw }); }
  return out; // FE hiện dạng gợi ý — khách vẫn tick chọn, KHÔNG tự động gắn
}

async function getProfile(userId: string) {
  const p = await prisma.jobProfile.findUnique({ where: { userId }, include: { fields: true } });
  if (!p) throw new AppError(400, 'Chưa có hồ sơ — làm Lát 1 trước');
  return p;
}

// ── POST /start ─ mở/tiếp phiên dựng (cho phép nghỉ & quay lại) ──
buildRouter.post('/start', async (req: any, res, next) => {
  try {
    const p = await getProfile(req.user.userId);
    let s = await prisma.buildSession.findFirst({ where: { profileId: p.id, status: 'DANG_LAM' }, orderBy: { updatedAt: 'desc' } });
    if (!s) s = await prisma.buildSession.create({ data: { profileId: p.id } });
    res.json({ sessionId: s.id, stepNo: s.stepNo, question: QUESTIONS[s.stepNo] ?? null, total: QUESTIONS.length });
  } catch (e) { next(e); }
});

// ── POST /answer ─ trả lời 1 câu → lưu + rút gợi ý → câu kế ──
const ansSchema = z.object({
  sessionId: z.string(),
  questionCode: z.string(),
  answerText: z.string().min(1),
  source: z.enum(['GO_TAY', 'CHON_GOI_Y', 'GIONG_NOI']).default('GO_TAY'),
});
buildRouter.post('/answer', async (req: any, res, next) => {
  try {
    const b = ansSchema.parse(req.body);
    const p = await getProfile(req.user.userId);
    const q = byCode(b.questionCode);
    if (!q) throw new AppError(400, 'Câu hỏi không hợp lệ');
    const s = await prisma.buildSession.findFirst({ where: { id: b.sessionId, profileId: p.id, status: 'DANG_LAM' } });
    if (!s) throw new AppError(404, 'Không thấy phiên đang làm');

    // Luật 91/2025: giọng nói CHỈ cho câu kể chuyện + phải có đồng ý VOICE.
    if (b.source === 'GIONG_NOI') {
      if (!q.mic) throw new AppError(400, 'Câu này không nhận giọng nói — mời gõ tay ạ');
      const consent = await prisma.dataConsent.findFirst({ where: { userId: req.user.userId, kind: 'VOICE', revokedAt: null } });
      if (!consent) throw new AppError(403, 'Cần bật đồng ý dùng giọng nói trước');
    }

    const extracted = q.kieu === 'ke_chuyen' ? goiYtuChuyen(b.answerText) : [];
    await prisma.buildAnswer.create({ data: { sessionId: s.id, questionCode: q.code, fieldCode: q.fieldCode ?? null, answerText: b.answerText, source: b.source, extracted } });

    // Câu lấp thẳng 1 ô hồ sơ (Khối 1,3) → cập nhật luôn, đánh dấu nguồn KE_KHAI.
    if (q.fieldCode) {
      await prisma.profileField.updateMany({
        where: { profileId: p.id, fieldCode: q.fieldCode },
        data: { value: b.answerText, source: 'KHACH_KHAI', status: 'DA_XAC_NHAN' },
      });
    }

    const nextIdx = Math.min(s.stepNo + 1, QUESTIONS.length);
    await prisma.buildSession.update({ where: { id: s.id }, data: { stepNo: nextIdx } });
    res.json({ suggested: extracted, nextStep: nextIdx, question: QUESTIONS[nextIdx] ?? null, done: nextIdx >= QUESTIONS.length });
  } catch (e) { next(e); }
});

// ── POST /skills ─ khách chốt kỹ năng đã tick (mã KN.*) → profile_skills ──
const skillSchema = z.object({ sessionId: z.string(), codes: z.array(z.string().regex(/^KN\./)).max(5) });
buildRouter.post('/skills', async (req: any, res, next) => {
  try {
    const b = skillSchema.parse(req.body);
    const p = await getProfile(req.user.userId);
    for (const code of b.codes)
      await prisma.profileSkill.upsert({
        where: { profileId_skillCode: { profileId: p.id, skillCode: code } },
        update: {}, create: { profileId: p.id, skillCode: code, source: 'KHACH_KHAI' },
      });
    res.json({ ok: true, count: b.codes.length });
  } catch (e) { next(e); }
});

// ── POST /finish ─ chốt phiên → sinh CV gốc (isOriginal) ──
buildRouter.post('/finish', async (req: any, res, next) => {
  try {
    const { sessionId } = z.object({ sessionId: z.string() }).parse(req.body);
    const p = await getProfile(req.user.userId);
    const s = await prisma.buildSession.findFirst({ where: { id: sessionId, profileId: p.id } });
    if (!s) throw new AppError(404, 'Không thấy phiên');

    // CV gốc để La Bàn (Hướng 2) đọc. Dev build .docx theo CHUAN-XUAT-CV-ATS
    // từ profile_fields (Khối 1,3) + profile_skills. Khối 2,4 KHÔNG vào CV.
    const cv = await prisma.cvDocument.create({
      data: { profileId: p.id, label: 'CV dựng từ hỏi–đáp', isOriginal: true },
    });
    await prisma.buildSession.update({ where: { id: s.id }, data: { status: 'XONG' } });
    res.json({ ok: true, cvId: cv.id, note: 'Dev: render .docx ATS rồi cập nhật cv.fileUrl' });
  } catch (e) { next(e); }
});
