// ============================================================
// LÁT 4 — API LUYỆN PHỎNG VẤN (mic bắt buộc — nghe lại chính mình)
// Khung NHÁP cho dev. Style repo: Express + prisma + zod + requireAuth.
// Cần: Lát 1 (data_consents), Lát 2 (job_targets), Lát 4 migration.
// Data: lat4-question-bank.json + seed-chuan-sol.json (nhãn kỹ năng).
// Gắn: app.use('/api/profile/interview', interviewRouter)
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import BANK from '../data/lat4-question-bank.json';
import seed from '../data/seed-chuan-sol.json';

export const interviewRouter = Router();
interviewRouter.use(requireAuth);

// nhãn kỹ năng: KN.* → tiếng Việt (để ghép câu hỏi từ JD)
const LABEL: Record<string, string> = Object.fromEntries(
  (seed as any).ky_nang.map((k: any) => [k.ma, k.nhan]),
);
const bank: any = BANK;

async function assertVoiceConsent(userId: string) {
  const c = await prisma.dataConsent.findFirst({ where: { userId, kind: 'VOICE', revokedAt: null } });
  if (!c) throw new AppError(403, 'Cần bật đồng ý dùng giọng nói trước khi luyện phỏng vấn');
}

// ── POST /start ─ tạo buổi + sinh câu hỏi (từ JD nếu có) ──
const startSchema = z.object({ targetId: z.string().optional() });
interviewRouter.post('/start', async (req: any, res, next) => {
  try {
    await assertVoiceConsent(req.user.userId);
    const { targetId } = startSchema.parse(req.body);
    const p = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId } });
    if (!p) throw new AppError(400, 'Chưa có hồ sơ');

    let jdCodes: string[] = [];
    if (targetId) {
      const t = await prisma.jobTarget.findFirst({ where: { id: targetId, profileId: p.id } });
      if (!t) throw new AppError(404, 'Không thấy JD');
      jdCodes = (t.required as any[]).filter((r) => String(r.code).startsWith('KN.')).map((r) => r.code);
    }

    const s = await prisma.interviewSession.create({ data: { profileId: p.id, targetId: targetId ?? null } });

    // Dựng bộ câu: 1 giới thiệu + tối đa 3 câu từ JD + 1 điểm mạnh + 1 khoảng trống.
    const qs: any[] = [];
    let n = 0;
    qs.push({ orderNo: n++, qSource: 'HANH_VI', text: bank.hanh_vi[0].text, goiY: bank.hanh_vi[0].goi_y });
    for (const code of jdCodes.slice(0, 3)) {
      const nhan = LABEL[code] ?? 'kỹ năng đó';
      qs.push({ orderNo: n++, qSource: 'TU_JD', refCode: code, text: bank.tu_jd_mau.replace(/{nhan}/g, nhan), goiY: 'Kể 1 tình huống thật + kết quả có con số.' });
    }
    qs.push({ orderNo: n++, qSource: 'HANH_VI', text: bank.hanh_vi[1].text, goiY: bank.hanh_vi[1].goi_y });
    qs.push({ orderNo: n++, qSource: 'KHOANG_TRONG', text: bank.khoang_trong[0].text, goiY: bank.khoang_trong[0].goi_y });

    await prisma.interviewQuestion.createMany({ data: qs.map((q) => ({ ...q, sessionId: s.id })) });
    const full = await prisma.interviewSession.findUnique({ where: { id: s.id }, include: { questions: { orderBy: { orderNo: 'asc' } } } });
    res.json(full);
  } catch (e) { next(e); }
});

// ── Gợi ý nhẹ sau khi khách NGHE LẠI (không chấm điểm gắt) ──
export function feedbackFor(seconds?: number, transcript?: string) {
  const out: any = { do_dai: 'ok', co_con_so: false, goi_y: [] as string[] };
  if (seconds != null) {
    if (seconds < 20) { out.do_dai = 'ngan'; out.goi_y.push('Câu trả lời hơi ngắn — thêm 1 ví dụ thật cho chắc.'); }
    else if (seconds > 120) { out.do_dai = 'dai'; out.goi_y.push('Hơi dài — gói gọn ý chính trong ~1 phút.'); }
  }
  if (transcript) {
    out.co_con_so = /\d/.test(transcript);
    if (!out.co_con_so) out.goi_y.push('Chưa có con số — thêm số (bao nhiêu người, doanh số, %…) sẽ đáng tin hơn.');
  }
  if (out.goi_y.length === 0) out.goi_y.push('Nghe ổn — giữ nhịp này ở các câu sau.');
  return out;
}

// ── PUT /answer ─ lưu ghi âm + tự chú thích → gợi ý nhẹ ──
// LƯU Ý: audioUrl do FE upload lên storage trước (không đưa file qua route này).
const answerSchema = z.object({
  questionId: z.string(),
  audioUrl: z.string().optional(),
  transcript: z.string().optional(),
  seconds: z.number().int().optional(),
  selfNote: z.string().optional(),
});
interviewRouter.put('/answer', async (req: any, res, next) => {
  try {
    await assertVoiceConsent(req.user.userId);
    const b = answerSchema.parse(req.body);
    // xác thực câu hỏi thuộc về user
    const q = await prisma.interviewQuestion.findFirst({
      where: { id: b.questionId, session: { profile: { userId: req.user.userId } } },
    });
    if (!q) throw new AppError(404, 'Không thấy câu hỏi');
    const feedback = feedbackFor(b.seconds, b.transcript);
    const saved = await prisma.interviewAnswer.upsert({
      where: { questionId: b.questionId },
      update: { audioUrl: b.audioUrl, transcript: b.transcript, seconds: b.seconds, selfNote: b.selfNote, feedback },
      create: { questionId: b.questionId, audioUrl: b.audioUrl, transcript: b.transcript, seconds: b.seconds, selfNote: b.selfNote, feedback },
    });
    res.json(saved); // FE: cho khách NGHE LẠI audioUrl + đọc feedback.goi_y
  } catch (e) { next(e); }
});

// ── POST /finish ─ đóng buổi ──
interviewRouter.post('/finish', async (req: any, res, next) => {
  try {
    const { sessionId } = z.object({ sessionId: z.string() }).parse(req.body);
    const s = await prisma.interviewSession.findFirst({ where: { id: sessionId, profile: { userId: req.user.userId } } });
    if (!s) throw new AppError(404, 'Không thấy buổi luyện');
    await prisma.interviewSession.update({ where: { id: s.id }, data: { status: 'XONG' } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── DELETE /answer/:questionId/audio ─ xoá ghi âm (rút đồng ý VOICE) ──
interviewRouter.delete('/answer/:questionId/audio', async (req: any, res, next) => {
  try {
    const a = await prisma.interviewAnswer.findFirst({
      where: { questionId: req.params.questionId, question: { session: { profile: { userId: req.user.userId } } } },
    });
    if (!a) throw new AppError(404, 'Không thấy ghi âm');
    await prisma.interviewAnswer.update({ where: { id: a.id }, data: { audioUrl: null } });
    // Dev: đồng thời xoá file trên storage.
    res.json({ ok: true });
  } catch (e) { next(e); }
});
