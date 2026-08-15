// ============================================================
// LÁT 2 — API CỬA A · khung NHÁP + HÀM CHẤM THẬT (Toàn Trình U40–60)
// Tham khảo — dev chỉnh cho khớp. Style repo: Express + prisma + zod + requireAuth.
// Cần: Lát 1 (job_profiles, profile_skills) + Lát 2 migration.
//      seed-chuan-sol.json đặt ở src/data/ (dùng jd_tu_khoa_map để tách JD).
// Gắn: app.use('/api/profile', jobTargetRouter)  (cùng prefix Lát 1)
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import seed from '../data/seed-chuan-sol.json';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const jobTargetRouter = Router();
jobTargetRouter.use(requireAuth);

// ── Bản đồ từ khoá → mã (dựng 1 lần) ──
const KW: Array<[string, string]> = (seed as any).jd_tu_khoa_map
  .map((x: any) => [x.tu_khoa.toLowerCase(), x.ma] as [string, string])
  .sort((a: any, b: any) => b[0].length - a[0].length); // cụm dài ưu tiên

// ── Tách JD → danh sách mã yêu cầu (KHÔNG xuất chữ tự do) ──
export function parseJD(text: string) {
  const low = ' ' + text.toLowerCase() + ' ';
  const found = new Set<string>();
  for (const [kw, code] of KW) if (low.includes(kw)) found.add(code);
  const required: Array<{ code: string; loai: string; diem: number }> =
    [...found].map((code) => ({ code, loai: 'lõi', diem: 20 }));
  // điều kiện số năm (nếu JD ghi "X năm")
  const m = text.match(/(\d+)\s*\+?\s*n[ăa]m/i);
  if (m) required.push({ code: `ATTR.sonam>=${m[1]}`, loai: 'điều kiện', diem: 10 });
  return required;
}

// ── AI đọc JD (hiểu ngữ nghĩa, cả yêu cầu ngầm) → mã yêu cầu ──
const _GK = process.env.GEMINI_API_KEY, _OK = process.env.OPENAI_API_KEY, _AK = process.env.ANTHROPIC_API_KEY;
const _PROV = _GK ? 'gemini' : _OK ? 'openai' : _AK ? 'anthropic' : null;
const _gem = _GK ? new GoogleGenerativeAI(_GK) : null;
const _oai = _OK ? new OpenAI({ apiKey: _OK }) : null;
const _ant = _AK ? new Anthropic({ apiKey: _AK }) : null;
const KY: Array<{ ma: string; nhan: string }> = (seed as any).ky_nang;
const VALIDK = new Set(KY.map((k) => k.ma));

async function _ai(prompt: string): Promise<string> {
  if (_PROV === 'gemini' && _gem) { const m = _gem.getGenerativeModel({ model: 'gemini-2.5-flash' }); const r = await m.generateContent(prompt); return r.response.text(); }
  if (_PROV === 'openai' && _oai) { const r = await _oai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.2 }); return r.choices[0]?.message?.content || ''; }
  if (_PROV === 'anthropic' && _ant) { const r = await _ant.messages.create({ model: 'claude-3-5-haiku-20241022', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }); const c = r.content[0]; return c && c.type === 'text' ? c.text : ''; }
  throw new Error('no-ai');
}
function _json(s: string): any {
  let t = s.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const i = t.indexOf('{'), j = t.lastIndexOf('}'); if (i >= 0 && j > i) t = t.slice(i, j + 1);
  return JSON.parse(t);
}
export async function aiParseJD(text: string) {
  const list = KY.map((k) => `${k.ma} = ${k.nhan}`).join('\n');
  const prompt = `Đọc TIN TUYỂN DỤNG dưới đây và trích các YÊU CẦU thành mã kỹ năng. Trả về DUY NHẤT JSON (không giải thích, không markdown):
{"required":[{"code":"mã","loai":"lõi hoặc phụ","diem":20}]}
QUY TẮC:
- code CHỈ lấy trong DANH SÁCH MÃ bên dưới, KHÔNG bịa. Đọc hiểu ngữ nghĩa: bắt cả yêu cầu diễn đạt khác từ khoá, và kỹ năng ngầm.
- "lõi" = bắt buộc/nhấn mạnh (diem 20). "phụ" = ưu tiên/lợi thế (diem 10).
- Nếu JD yêu cầu tối thiểu X năm kinh nghiệm, thêm {"code":"ATTR.sonam>=X","loai":"điều kiện","diem":10}.
- Chọn tối đa 10 mã đúng nhất. Chỉ trả JSON.
DANH SÁCH MÃ (mã = nghĩa):
${list}
===== TIN TUYỂN DỤNG =====
${text.slice(0, 10000)}`;
  const d = _json(await _ai(prompt));
  const arr = Array.isArray(d.required) ? d.required : [];
  const out: Array<{ code: string; loai: string; diem: number }> = [];
  const seen = new Set<string>();
  for (const r of arr) {
    const code = String(r.code || ''); if (seen.has(code)) continue;
    if (code.startsWith('ATTR.sonam>=')) { seen.add(code); out.push({ code, loai: 'điều kiện', diem: 10 }); continue; }
    if (VALIDK.has(code)) { seen.add(code); const phu = r.loai === 'phụ'; out.push({ code, loai: phu ? 'phụ' : 'lõi', diem: phu ? 10 : 20 }); }
  }
  return out;
}

// ── CHẤM: hồ sơ (mã kỹ năng) × JD (mã yêu cầu) → % + checklist + chiều 2 ──
export function scoreProfile(
  have: Set<string>,
  required: Array<{ code: string; loai: string; diem: number }>,
  sonam?: number,
) {
  let total = 0, matched = 0;
  const checklist: any[] = [];
  const missing: any[] = [];
  for (const r of required) {
    total += r.diem;
    let ok = false;
    if (r.code.startsWith('ATTR.sonam>=')) {
      const need = parseInt(r.code.split('>=')[1], 10);
      ok = (sonam ?? 0) >= need;
    } else ok = have.has(r.code);
    if (ok) { matched += r.diem; checklist.push({ code: r.code, state: 'DA_CO' }); }
    else    { checklist.push({ code: r.code, state: 'CON_THIEU' }); missing.push(r); }
  }
  const score = total ? Math.round((matched / total) * 100) : 0;
  // Chiều 2: mặc định xếp missing vào "phải đi học". Dev tinh chỉnh:
  // - nếu khách CÓ kỹ năng nhưng CV chưa nêu số/không viết → VIET_LAI (đọc từ profile_fields).
  const chieu2 = { viet_lai: [] as any[], phai_hoc: missing.map((r) => ({ code: r.code })) };
  return { score, checklist, chieu2 };
}

async function getProfile(userId: string) {
  const p = await prisma.jobProfile.findUnique({ where: { userId }, include: { skills: true, fields: true } });
  if (!p) throw new AppError(400, 'Chưa có hồ sơ — làm Lát 1 trước');
  return p;
}

// ── POST /api/profile/cv ─ ghi nhận CV (parse để điền field/skill là bước riêng) ──
const cvSchema = z.object({ label: z.string().optional(), isOriginal: z.boolean().optional(), fileUrl: z.string().optional() });
jobTargetRouter.post('/cv', async (req: any, res, next) => {
  try {
    const b = cvSchema.parse(req.body);
    const p = await getProfile(req.user.userId);
    const cv = await prisma.cvDocument.create({ data: { profileId: p.id, label: b.label, isOriginal: b.isOriginal ?? false, fileUrl: b.fileUrl } });
    // TODO: parse CV → upsert profile_fields (Khối 1,3) + profile_skills; Khối 2,4 giữ CON_TRONG.
    res.json(cv);
  } catch (e) { next(e); }
});

// ── POST /api/profile/target ─ dán JD → tách thành mã ──
const targetSchema = z.object({ title: z.string().optional(), jdRaw: z.string().min(10), applyVia: z.enum(['TRANG_TUYEN_DUNG','NGUOI_QUEN']).optional() });
jobTargetRouter.post('/target', async (req: any, res, next) => {
  try {
    const b = targetSchema.parse(req.body);
    const p = await getProfile(req.user.userId);
    // AI đọc hiểu JD trước; nếu lỗi/không cấu hình/không ra mã → dò từ khoá
    let required: Array<{ code: string; loai: string; diem: number }> = [];
    try { required = await aiParseJD(b.jdRaw); } catch (err) { console.error('[target] aiParseJD lỗi, dùng từ khoá:', (err as any)?.message); }
    if (!required.length) required = parseJD(b.jdRaw);
    const target = await prisma.jobTarget.create({ data: { profileId: p.id, title: b.title, jdRaw: b.jdRaw, applyVia: b.applyVia, required } });
    res.json(target);
  } catch (e) { next(e); }
});

// ── POST /api/profile/target/:id/run ─ CHẤM (mỗi lần = 1 phiên bản) ──
jobTargetRouter.post('/target/:id/run', async (req: any, res, next) => {
  try {
    const p = await getProfile(req.user.userId);
    const target = await prisma.jobTarget.findFirst({ where: { id: req.params.id, profileId: p.id }, include: { runs: { orderBy: { createdAt: 'asc' }, take: 1 } } });
    if (!target) throw new AppError(404, 'Không thấy hồ sơ mục tiêu');
    const have = new Set(p.skills.map((s) => s.skillCode));
    const sonamField = p.fields.find((f) => f.fieldCode === 'K1.sonam');
    const sonam = sonamField?.value ? parseInt(sonamField.value, 10) : undefined;
    const { score, checklist, chieu2 } = scoreProfile(have, target.required as any, sonam);
    const scoreFirst = target.runs[0]?.scoreFirst ?? score; // giữ số lần đầu
    const run = await prisma.matchRun.create({ data: { targetId: target.id, scoreFirst, scoreNow: score, checklist, chieu2 } });
    res.json(run); // FE hiện "lần đầu {scoreFirst} · giờ {scoreNow}" + checklist + chiều 2
  } catch (e) { next(e); }
});

// ── GET /api/profile/target/:id/runs ─ xem các phiên bản (so số cũ/mới) ──
jobTargetRouter.get('/target/:id/runs', async (req: any, res, next) => {
  try {
    const p = await getProfile(req.user.userId);
    const runs = await prisma.matchRun.findMany({ where: { target: { id: req.params.id, profileId: p.id } }, orderBy: { createdAt: 'desc' } });
    res.json(runs);
  } catch (e) { next(e); }
});
