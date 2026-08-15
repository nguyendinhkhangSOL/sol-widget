// ============================================================
// LÁT 5 — API THƯ ỨNG TUYỂN · khung NHÁP + HÀM SINH THƯ THẬT
// Style repo: Express + prisma + zod + requireAuth.
// Cần: Lát 1 (profile_fields/skills), Lát 2 (job_targets), Lát 5 migration.
// Data: seed-chuan-sol.json (nhãn kỹ năng KN.* → tiếng Việt).
// Gắn: app.use('/api/profile/letter', letterRouter)
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import seed from '../data/seed-chuan-sol.json';

export const letterRouter = Router();
letterRouter.use(requireAuth);

const LABEL: Record<string, string> = Object.fromEntries(
  (seed as any).ky_nang.map((k: any) => [k.ma, k.nhan]),
);

// tiện đọc 1 ô hồ sơ
const fieldVal = (fields: any[], code: string) => fields.find((f) => f.fieldCode === code)?.value?.trim() || '';

// ── HÀM SINH THƯ: hồ sơ × JD → thư tiếng Việt, plain text, chuẩn ATS ──
export function buildLetter(opts: {
  hoTen: string; chucDanh: string; soNam: string; nganh: string; thanhQua: string;
  viTri: string; congTy: string; kyNangKhop: string[]; toName?: string;
}) {
  const { hoTen, chucDanh, soNam, nganh, thanhQua, viTri, congTy, kyNangKhop, toName } = opts;
  const kinhGui = toName?.trim() ? `Kính gửi ${toName.trim()},` : `Kính gửi Quý công ty${congTy ? ' ' + congTy : ''},`;

  const cauKinhNghiem = [
    chucDanh && `Tôi có ${soNam || 'nhiều'} năm kinh nghiệm ở vị trí ${chucDanh}`,
    nganh && `trong ngành ${nganh}`,
  ].filter(Boolean).join(' ') + '.';

  const cauKyNang = kyNangKhop.length
    ? `Đối chiếu với yêu cầu công việc, tôi có thể đảm nhận: ${kyNangKhop.join(', ')}.`
    : 'Tôi tin kinh nghiệm của mình phù hợp với yêu cầu công việc.';

  const cauThanhQua = thanhQua ? `Một kết quả tôi tâm đắc: ${thanhQua}.` : '';

  return [
    kinhGui,
    ``,
    `Tôi là ${hoTen || '[Họ và tên]'}, viết thư này để ứng tuyển vị trí ${viTri || '[tên vị trí]'}${congTy ? ` tại ${congTy}` : ''}.`,
    ``,
    `${cauKinhNghiem} ${cauKyNang}${cauThanhQua ? ' ' + cauThanhQua : ''}`,
    ``,
    `Tôi mong có cơ hội trao đổi thêm và đóng góp cho công việc. Hồ sơ (CV) của tôi được đính kèm. Rất mong nhận được phản hồi từ Quý công ty.`,
    ``,
    `Trân trọng cảm ơn,`,
    hoTen || '[Họ và tên]',
  ].join('\n');
}

// ── POST /api/profile/letter ─ sinh thư cho 1 JD ──
const genSchema = z.object({ targetId: z.string(), toName: z.string().optional() });
letterRouter.post('/', async (req: any, res, next) => {
  try {
    const b = genSchema.parse(req.body);
    const p = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId }, include: { fields: true, skills: true } });
    if (!p) throw new AppError(400, 'Chưa có hồ sơ — làm Lát 1 trước');
    const t = await prisma.jobTarget.findFirst({ where: { id: b.targetId, profileId: p.id } });
    if (!t) throw new AppError(404, 'Không thấy JD');

    // kỹ năng KHỚP = mã JD ∩ mã hồ sơ → nhãn tiếng Việt (chỉ nêu cái khách THỰC SỰ có)
    const have = new Set(p.skills.map((s) => s.skillCode));
    const kyNangKhop = (t.required as any[])
      .filter((r) => String(r.code).startsWith('KN.') && have.has(r.code))
      .map((r) => LABEL[r.code] ?? r.code);

    const body = buildLetter({
      hoTen: (await prisma.user.findUnique({ where: { id: req.user.userId } }))?.displayName ?? '',
      chucDanh: fieldVal(p.fields, 'K1.chucdanh'),
      soNam: fieldVal(p.fields, 'K1.sonam'),
      nganh: fieldVal(p.fields, 'K1.nganh'),
      thanhQua: fieldVal(p.fields, 'K1.quymo'),           // "Quy mô từng quản (người/tiền)" = kết quả có số
      viTri: t.title ?? '',
      congTy: '', // dev: tách tên công ty từ JD nếu có
      kyNangKhop,
      toName: b.toName,
    });

    const letter = await prisma.coverLetter.create({ data: { profileId: p.id, targetId: t.id, toName: b.toName, body } });
    res.json(letter); // FE: hiện thư, cho khách SỬA rồi copy/tải kèm CV
  } catch (e) { next(e); }
});

// ── PUT /api/profile/letter/:id ─ khách sửa tay thư ──
letterRouter.put('/:id', async (req: any, res, next) => {
  try {
    const { body, toName } = z.object({ body: z.string().min(10), toName: z.string().optional() }).parse(req.body);
    const l = await prisma.coverLetter.findFirst({ where: { id: req.params.id, profile: { userId: req.user.userId } } });
    if (!l) throw new AppError(404, 'Không thấy thư');
    const saved = await prisma.coverLetter.update({ where: { id: l.id }, data: { body, toName, edited: true } });
    res.json(saved);
  } catch (e) { next(e); }
});

// ── GET /api/profile/letter?targetId= ─ lấy thư đã sinh cho 1 JD ──
letterRouter.get('/', async (req: any, res, next) => {
  try {
    const targetId = z.string().parse(req.query.targetId);
    const list = await prisma.coverLetter.findMany({
      where: { targetId, profile: { userId: req.user.userId } }, orderBy: { updatedAt: 'desc' },
    });
    res.json(list);
  } catch (e) { next(e); }
});
