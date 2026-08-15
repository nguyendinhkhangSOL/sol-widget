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

// ── nhãn kỹ năng để hiện chữ (không lộ mã) ──
const NHAN: Record<string, string> = Object.fromEntries(KY.map((k) => [k.ma, k.nhan]));
const nhanCua = (code: string) =>
  code.startsWith('ATTR.sonam>=') ? `Kinh nghiệm ${code.split('>=')[1]}+ năm` : (NHAN[code] || code);

// ── CHẤM: hồ sơ (mã kỹ năng + mức độ) × JD (mã yêu cầu) → % + checklist + chiều 2 ──
// haveLevel: Map mã → mức độ ('CO_BAN' = biết một ít → nửa điểm · khác/undefined-có = đủ điểm)
export function scoreProfile(
  haveLevel: Map<string, string | null | undefined>,
  required: Array<{ code: string; loai: string; diem: number }>,
  sonam?: number,
) {
  let total = 0, matched = 0;
  const checklist: any[] = [];
  const missing: any[] = [];   // chưa có → phải học
  const partial: any[] = [];   // biết một ít → nâng cao
  for (const r of required) {
    total += r.diem;
    if (r.code.startsWith('ATTR.sonam>=')) {
      const need = parseInt(r.code.split('>=')[1], 10);
      const ok = (sonam ?? 0) >= need;
      if (ok) { matched += r.diem; checklist.push({ code: r.code, nhan: nhanCua(r.code), state: 'DA_CO' }); }
      else { checklist.push({ code: r.code, nhan: nhanCua(r.code), state: 'CON_THIEU' }); missing.push(r); }
      continue;
    }
    const has = haveLevel.has(r.code);
    const lvl = haveLevel.get(r.code);
    if (!has) { checklist.push({ code: r.code, nhan: nhanCua(r.code), state: 'CON_THIEU' }); missing.push(r); }
    else if (lvl === 'CO_BAN') {
      const half = Math.round(r.diem / 2); matched += half;
      checklist.push({ code: r.code, nhan: nhanCua(r.code), state: 'CO_BAN' }); partial.push(r);
    } else { matched += r.diem; checklist.push({ code: r.code, nhan: nhanCua(r.code), state: 'DA_CO' }); }
  }
  const score = total ? Math.round((matched / total) * 100) : 0;
  const chieu2 = {
    viet_lai: [] as any[],
    phai_hoc: missing.map((r) => ({ code: r.code, nhan: nhanCua(r.code) })),
    nang_cao: partial.map((r) => ({ code: r.code, nhan: nhanCua(r.code) })),
  };
  return { score, checklist, chieu2, missing, partial };
}

// ── AI viết khuyến nghị hoàn thiện hồ sơ (giọng đời thường, cho U40–60) ──
async function goiYHoanThien(title: string | null, missing: any[], partial: any[]): Promise<string> {
  const thieu = missing.map((r) => nhanCua(r.code));
  const bietit = partial.map((r) => nhanCua(r.code));
  if (!thieu.length && !bietit.length) return 'Hồ sơ đã khớp tốt với vị trí này. Anh/chị có thể nộp và viết thư ứng tuyển.';
  try {
    const prompt = `Bạn là cố vấn nghề nghiệp thân thiện cho người 40–60 tuổi ở Việt Nam. Viết lời khuyên NGẮN GỌN, đời thường (xưng "anh/chị"), giúp họ hoàn thiện hồ sơ cho vị trí "${title || 'này'}".
- Kỹ năng họ CHƯA CÓ (cần học/né): ${thieu.join(', ') || 'không'}.
- Kỹ năng họ BIẾT MỘT ÍT (cần làm rõ/nâng): ${bietit.join(', ') || 'không'}.
YÊU CẦU:
- Mỗi kỹ năng 1 câu: cách bổ sung nhanh hoặc học ở đâu, thực tế, không sáo rỗng.
- Không dùng thuật ngữ Tây khó hiểu. Không markdown, không tiêu đề. Trả về 2–5 câu, xuống dòng giữa các ý.`;
    const t = (await _ai(prompt)).trim();
    if (t) return t;
  } catch (e) { console.error('[goiYHoanThien] AI lỗi:', (e as any)?.message); }
  // dự phòng tĩnh
  const parts: string[] = [];
  if (bietit.length) parts.push(`Anh/chị nêu 1–2 ví dụ cụ thể cho: ${bietit.join(', ')} để nâng thành thạo.`);
  if (thieu.length) parts.push(`Nên bổ sung hoặc học thêm: ${thieu.join(', ')}. Nếu không hợp, cân nhắc chọn việc khác gần với thế mạnh hơn.`);
  return parts.join('\n');
}

// ── AI sinh việc hoàn thiện CV theo từng mục (dòng CV để dán / ví dụ / cách học) ──
const KIND_OF: Record<string, string> = { DA_CO: 'THEM_CV', BIET_IT: 'NANG_CAO', CHUA_BIET: 'HOC' };
async function goiYTungMuc(title: string | null, rows: Array<{ code: string; nhan: string; kind: string }>): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!rows.length) return out;
  const moTa: Record<string, string> = { THEM_CV: 'ĐÃ CÓ nhưng CV chưa ghi', NANG_CAO: 'BIẾT MỘT ÍT', HOC: 'CHƯA BIẾT' };
  try {
    const list = rows.map((r, i) => `${i + 1}. [${r.kind}] ${r.nhan} — ${moTa[r.kind]}`).join('\n');
    const prompt = `Vị trí ứng tuyển: "${title || 'này'}". Giúp người 40–60 tuổi hoàn thiện CV để QUA vòng lọc tin tuyển dụng. Với mỗi mục:
- [THEM_CV]: viết SẴN 1 gạch đầu dòng (bullet) tiếng Việt để họ DÁN THẲNG vào CV — thể hiện kỹ năng đó qua việc/kết quả cụ thể, tự nhiên, không khoe lố.
- [NANG_CAO]: gợi ý 1 ví dụ hoặc con số nên bổ sung để chứng minh mức thành thạo.
- [HOC]: 1 câu ngắn — học nhanh ở đâu, hoặc nói thẳng nếu không hợp thì bỏ qua việc này.
Xưng "anh/chị", đời thường, KHÔNG thuật ngữ Tây khó hiểu.
Trả về DUY NHẤT JSON: {"items":[{"i":<số thứ tự>,"goi_y":"..."}]}. Chỉ JSON.
DANH SÁCH:
${list}`;
    const d = _json(await _ai(prompt));
    const arr = Array.isArray(d.items) ? d.items : [];
    for (const it of arr) {
      const idx = parseInt(it.i, 10) - 1;
      if (rows[idx] && it.goi_y) out.set(rows[idx].code, String(it.goi_y).trim());
    }
    if (out.size) return out;
  } catch (e) { console.error('[goiYTungMuc] AI lỗi:', (e as any)?.message); }
  // dự phòng tĩnh
  for (const r of rows) {
    if (r.kind === 'THEM_CV') out.set(r.code, `• Thêm 1 dòng cho "${r.nhan}": nêu một việc/kết quả cụ thể anh/chị từng làm liên quan đến kỹ năng này.`);
    else if (r.kind === 'NANG_CAO') out.set(r.code, `Bổ sung 1 ví dụ hoặc con số cho "${r.nhan}" để chứng minh mức thành thạo.`);
    else out.set(r.code, `"${r.nhan}" hiện chưa có — cân nhắc học thêm, hoặc chọn việc gần thế mạnh hơn.`);
  }
  return out;
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
    const haveLevel = new Map<string, string | null | undefined>(p.skills.map((s: any) => [s.skillCode, s.mucDo]));
    const sonamField = p.fields.find((f) => f.fieldCode === 'K1.sonam');
    const sonam = sonamField?.value ? parseInt(sonamField.value, 10) : undefined;
    const { score, checklist, chieu2, missing, partial } = scoreProfile(haveLevel, target.required as any, sonam);
    (chieu2 as any).khuyen_nghi = await goiYHoanThien(target.title, missing, partial);
    const scoreFirst = target.runs[0]?.scoreFirst ?? score; // giữ số lần đầu
    const run = await prisma.matchRun.create({ data: { targetId: target.id, scoreFirst, scoreNow: score, checklist, chieu2 } });
    res.json(run); // FE hiện "lần đầu {scoreFirst} · giờ {scoreNow}" + checklist + chiều 2 + khuyến nghị
  } catch (e) { next(e); }
});

// ── POST /api/profile/target/:id/hoan-thien ─ khách tự khai mục JD cần mà chưa có ──
// body: { answers: [{ code, muc_do: 'DA_CO' | 'BIET_IT' | 'CHUA_BIET' }] }
//   DA_CO   → thêm kỹ năng (đủ điểm)   BIET_IT → thêm (nửa điểm)   CHUA_BIET → bỏ (giữ là phải học)
const hoanThienSchema = z.object({
  answers: z.array(z.object({
    code: z.string().min(2),
    muc_do: z.enum(['DA_CO', 'BIET_IT', 'CHUA_BIET']),
  })).min(1),
});
jobTargetRouter.post('/target/:id/hoan-thien', async (req: any, res, next) => {
  try {
    const b = hoanThienSchema.parse(req.body);
    const p = await getProfile(req.user.userId);
    const target = await prisma.jobTarget.findFirst({ where: { id: req.params.id, profileId: p.id }, include: { runs: { orderBy: { createdAt: 'asc' }, take: 1 } } });
    if (!target) throw new AppError(404, 'Không thấy hồ sơ mục tiêu');

    // 1) ghi kỹ năng khách tự khai (chỉ mã hợp lệ)
    let added = 0;
    for (const a of b.answers) {
      if (a.muc_do === 'CHUA_BIET') continue;      // chưa biết → không thêm vào hồ sơ
      if (!VALIDK.has(a.code)) continue;
      const mucDo = a.muc_do === 'BIET_IT' ? 'CO_BAN' : null; // DA_CO = thành thạo (null)
      await prisma.profileSkill.upsert({
        where: { profileId_skillCode: { profileId: p.id, skillCode: a.code } },
        update: { mucDo, source: 'KHACH_KHAI', status: 'DA_XAC_NHAN' },
        create: { profileId: p.id, skillCode: a.code, mucDo, source: 'KHACH_KHAI', status: 'DA_XAC_NHAN' },
      });
      added++;
    }

    // 2) LƯU "việc hoàn thiện ngược" + AI viết dòng CV theo JD
    const rows = b.answers.map((a) => ({ code: a.code, nhan: nhanCua(a.code), kind: KIND_OF[a.muc_do] }));
    const goiYMap = await goiYTungMuc(target.title, rows);
    for (const r of rows) {
      await prisma.hoSoHoanThien.upsert({
        where: { profileId_skillCode: { profileId: p.id, skillCode: r.code } },
        update: { targetId: target.id, kind: r.kind, goiY: goiYMap.get(r.code) || null, status: 'CHUA_LAM' },
        create: { profileId: p.id, targetId: target.id, skillCode: r.code, kind: r.kind, goiY: goiYMap.get(r.code) || null },
      });
    }
    const htRows = await prisma.hoSoHoanThien.findMany({ where: { profileId: p.id }, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] });
    const hoan_thien = htRows.map((it: any) => ({ id: it.id, skillCode: it.skillCode, nhan: nhanCua(it.skillCode), kind: it.kind, goiY: it.goiY, status: it.status }));

    // 3) chấm lại (đọc hồ sơ mới) → tạo phiên bản mới
    const p2 = await getProfile(req.user.userId);
    const haveLevel = new Map<string, string | null | undefined>(p2.skills.map((s: any) => [s.skillCode, s.mucDo]));
    const sonamField = p2.fields.find((f) => f.fieldCode === 'K1.sonam');
    const sonam = sonamField?.value ? parseInt(sonamField.value, 10) : undefined;
    const { score, checklist, chieu2, missing, partial } = scoreProfile(haveLevel, target.required as any, sonam);
    (chieu2 as any).khuyen_nghi = await goiYHoanThien(target.title, missing, partial);
    const scoreFirst = target.runs[0]?.scoreFirst ?? score;
    const run = await prisma.matchRun.create({ data: { targetId: target.id, scoreFirst, scoreNow: score, checklist, chieu2 } });
    res.json({ ...run, added, hoan_thien });
  } catch (e) { next(e); }
});

// ── GET /api/profile/completion ─ danh sách việc hoàn thiện hồ sơ (thường trực) ──
jobTargetRouter.get('/completion', async (req: any, res, next) => {
  try {
    const p = await getProfile(req.user.userId);
    const items = await prisma.hoSoHoanThien.findMany({ where: { profileId: p.id }, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] });
    res.json(items.map((it: any) => ({ id: it.id, skillCode: it.skillCode, nhan: nhanCua(it.skillCode), kind: it.kind, goiY: it.goiY, status: it.status })));
  } catch (e) { next(e); }
});

// ── POST /api/profile/completion/:id/done ─ đánh dấu đã bổ sung ──
jobTargetRouter.post('/completion/:id/done', async (req: any, res, next) => {
  try {
    const p = await getProfile(req.user.userId);
    const it = await prisma.hoSoHoanThien.findFirst({ where: { id: req.params.id, profileId: p.id } });
    if (!it) throw new AppError(404, 'Không thấy việc này');
    await prisma.hoSoHoanThien.update({ where: { id: it.id }, data: { status: 'DA_LAM' } });
    // Nếu là "thêm vào CV" → coi như CV đã chứng thực kỹ năng (đổi nguồn KHÁCH KHAI → CV)
    if (it.kind === 'THEM_CV') {
      await prisma.profileSkill.updateMany({ where: { profileId: p.id, skillCode: it.skillCode }, data: { source: 'CV' } });
    }
    res.json({ ok: true });
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
