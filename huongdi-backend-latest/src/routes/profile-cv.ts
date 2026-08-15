// ============================================================
// /api/profile/cv/parse — AI bóc tách CV → tự điền hồ sơ (Toàn Trình)
// Dùng lại provider AI của app (Gemini > OpenAI > Anthropic).
// Nhận TEXT (FE đã trích từ PDF/Word), trả hồ sơ đã cập nhật.
// ============================================================
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import seed from '../data/seed-chuan-sol.json';

export const cvParseRouter = Router();
cvParseRouter.use(requireAuth);

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PROVIDER = GEMINI_KEY ? 'gemini' : OPENAI_KEY ? 'openai' : ANTHROPIC_KEY ? 'anthropic' : null;
const gemini = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

const KY_NANG: Array<{ ma: string; nhan: string }> = (seed as any).ky_nang;
const NGANH: Array<{ ma: string; nhan: string }> = (seed as any).nganh;
const VALID_SKILL = new Set(KY_NANG.map((k) => k.ma));

function buildPrompt(cv: string) {
  const skills = KY_NANG.map((k) => `${k.ma} = ${k.nhan}`).join('\n');
  const nganh = NGANH.map((n) => `${n.ma} = ${n.nhan}`).join('\n');
  return `Bạn là trợ lý đọc CV tiếng Việt. Đọc CV dưới đây và TRÍCH ra thông tin, TRẢ VỀ DUY NHẤT một JSON (không giải thích, không markdown).

Định dạng JSON:
{
 "nganh": "tên ngành (chữ, ví dụ: Hàng tiêu dùng nhanh)",
 "chucdanh": "chức danh gần nhất",
 "capbac": "nhân viên | trưởng nhóm | quản lý | giám đốc | ''",
 "sonam": <số năm kinh nghiệm, số nguyên, hoặc null>,
 "quymo": "quy mô từng quản lý (số người / doanh số), hoặc ''",
 "tinh": "tỉnh/thành đang ở",
 "skills": ["mã kỹ năng"]
}

QUY TẮC:
- "skills" CHỈ được chọn từ danh sách MÃ dưới đây, không tự bịa mã. Chọn tối đa 12 mã đúng nhất với CV.
- Đọc hiểu ngữ nghĩa, KHÔNG chỉ dò từ khoá. Bắt cả:
  · Kỹ năng liệt kê ở mục KỸ NĂNG/NGÔN NGỮ (ví dụ "Write"→soạn thảo văn bản, "Sales"→bán hàng, "Leader"→lãnh đạo/quản lý).
  · Công cụ văn phòng (Excel/Word/PowerPoint), nhập & quản lý dữ liệu, làm việc với dữ liệu — nếu CV thể hiện qua mô tả công việc dù không ghi thẳng tên công cụ.
  · Kỹ năng suy ra từ chức danh + mô tả (CEO/Giám đốc → quản lý điều hành, vận hành, quản lý dự án).
- Thiếu thông tin nào thì để "" hoặc null.
- Chỉ trả JSON.

DANH SÁCH MÃ KỸ NĂNG (mã = nghĩa):
${skills}

DANH SÁCH NGÀNH:
${nganh}

===== CV =====
${cv.slice(0, 12000)}`;
}

async function callAI(prompt: string): Promise<string> {
  if (PROVIDER === 'gemini' && gemini) {
    const m = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const r = await m.generateContent(prompt);
    return r.response.text();
  }
  if (PROVIDER === 'openai' && openai) {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.2,
    });
    return r.choices[0]?.message?.content || '';
  }
  if (PROVIDER === 'anthropic' && anthropic) {
    const r = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const c = r.content[0];
    return c && c.type === 'text' ? c.text : '';
  }
  throw new AppError(503, 'Chưa cấu hình AI trên máy chủ');
}

function extractJson(s: string): any {
  let t = s.trim().replace(/^```(?:json)?/i, '').replace(/```$/,'').trim();
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i >= 0 && j > i) t = t.slice(i, j + 1);
  return JSON.parse(t);
}

const blockOf = (code: string) => parseInt(code.charAt(1), 10) || 1;

// ── POST /api/profile/cv/parse ──
cvParseRouter.post('/cv/parse', async (req: any, res, next) => {
  try {
    const { text } = z.object({ text: z.string().min(30, 'Nội dung CV quá ngắn') }).parse(req.body);
    const profile = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId } });
    if (!profile) throw new AppError(400, 'Chưa có hồ sơ — mở trang hồ sơ trước');

    const raw = await callAI(buildPrompt(text));
    let data: any;
    try { data = extractJson(raw); } catch { throw new AppError(502, 'AI trả về không đọc được, thử lại giúp em'); }

    // 1) điền các ô Khối 1 + Khối 3 (nguồn = CV, chờ xác nhận)
    const fieldMap: Array<[string, any]> = [
      ['K1.nganh', data.nganh], ['K1.chucdanh', data.chucdanh], ['K1.capbac', data.capbac],
      ['K1.sonam', data.sonam != null ? String(data.sonam) : ''], ['K1.quymo', data.quymo], ['K3.tinh', data.tinh],
    ];
    let filled = 0;
    for (const [code, val] of fieldMap) {
      const v = (val == null ? '' : String(val)).trim();
      if (!v) continue;
      await prisma.profileField.upsert({
        where: { profileId_fieldCode: { profileId: profile.id, fieldCode: code } },
        update: { value: v, source: 'CV', status: 'CHUA_XAC_NHAN' },
        create: { profileId: profile.id, fieldCode: code, blockNo: blockOf(code), value: v, source: 'CV', status: 'CHUA_XAC_NHAN' },
      });
      filled++;
    }

    // 2) gắn kỹ năng (chỉ mã hợp lệ)
    const skills: string[] = Array.isArray(data.skills) ? data.skills.filter((s: any) => VALID_SKILL.has(s)) : [];
    for (const code of skills) {
      await prisma.profileSkill.upsert({
        where: { profileId_skillCode: { profileId: profile.id, skillCode: code } },
        update: { source: 'CV' }, create: { profileId: profile.id, skillCode: code, source: 'CV', status: 'CHUA_XAC_NHAN' },
      });
    }

    // 2b) LƯU CV GỐC (text vừa dán) vào Dashboard — 1 bản gốc/hồ sơ
    const goc = await prisma.cvDocument.findFirst({ where: { profileId: profile.id, isOriginal: true } });
    if (goc) await prisma.cvDocument.update({ where: { id: goc.id }, data: { parsedText: text, label: goc.label || 'CV gốc' } });
    else await prisma.cvDocument.create({ data: { profileId: profile.id, isOriginal: true, label: 'CV gốc', parsedText: text } });

    // 3) trả hồ sơ mới (gom 4 khối) để FE vẽ lại
    const full = await prisma.jobProfile.findUnique({ where: { id: profile.id }, include: { fields: true, skills: true } });
    const khoi: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const f of full!.fields) khoi[f.blockNo]?.push(f);
    res.json({ ok: true, filled, skillsAdded: skills.length, profile: { id: full!.id, khoi, skills: full!.skills } });
  } catch (e) { next(e); }
});

// ============================================================
// CV trong Dashboard: 1 bản GỐC + N bản HOÀN THIỆN theo JD
// ============================================================
const NHAN_SKILL: Record<string, string> = Object.fromEntries(KY_NANG.map((k) => [k.ma, k.nhan]));

async function composeCV(opts: { title?: string | null; goc?: string | null; fields: any[]; skills: string[]; bullets: string[] }): Promise<string> {
  const fieldLine = opts.fields.filter((f) => f.value).map((f) => `${f.fieldCode}: ${f.value}`).join('\n');
  const skillLine = opts.skills.map((c) => NHAN_SKILL[c] || c).join(', ');
  try {
    const prompt = `Viết một CV tiếng Việt gọn gàng, chuyên nghiệp để nộp cho vị trí "${opts.title || 'ứng tuyển'}", dựa trên thông tin dưới đây. Người dùng 40–60 tuổi. Trình bày rõ các mục: THÔNG TIN LIÊN HỆ (nếu có), MỤC TIÊU NGHỀ NGHIỆP, KINH NGHIỆM & THẾ MẠNH, KỸ NĂNG. Lồng TỰ NHIÊN các điểm cần làm nổi bật để hợp vị trí. TUYỆT ĐỐI KHÔNG bịa số liệu hay công ty. Trả về VĂN BẢN THUẦN (không markdown, không giải thích).
--- HỒ SƠ ---
${fieldLine || '(chưa có)'}
KỸ NĂNG: ${skillLine || '(chưa có)'}
--- ĐIỂM CẦN LÀM NỔI BẬT CHO VỊ TRÍ NÀY ---
${opts.bullets.join('\n') || '(không)'}
${opts.goc ? '--- CV GỐC (tham khảo văn phong & dữ kiện có thật) ---\n' + opts.goc.slice(0, 6000) : ''}`;
    const t = (await callAI(prompt)).trim();
    if (t) return t;
  } catch (e) { console.error('[composeCV] AI lỗi:', (e as any)?.message); }
  // dự phòng cơ học
  const parts: string[] = [];
  if (fieldLine) parts.push(fieldLine);
  if (skillLine) parts.push('KỸ NĂNG: ' + skillLine);
  if (opts.bullets.length) parts.push('ĐIỂM NỔI BẬT:\n' + opts.bullets.join('\n'));
  if (opts.goc) parts.push('--- CV GỐC ---\n' + opts.goc);
  return parts.join('\n\n');
}

// GET /api/profile/cv/list ─ danh sách CV (gốc trước, rồi các bản hoàn thiện)
cvParseRouter.get('/cv/list', async (req: any, res, next) => {
  try {
    const profile = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId } });
    if (!profile) throw new AppError(400, 'Chưa có hồ sơ');
    const docs = await prisma.cvDocument.findMany({ where: { profileId: profile.id }, orderBy: [{ isOriginal: 'desc' }, { createdAt: 'desc' }] });
    res.json(docs.map((d: any) => ({ id: d.id, label: d.label, isOriginal: d.isOriginal, targetId: d.targetId, parsedText: d.parsedText, createdAt: d.createdAt })));
  } catch (e) { next(e); }
});

// POST /api/profile/cv/hoan-thien {targetId} ─ tạo bản CV hoàn thiện theo JD
cvParseRouter.post('/cv/hoan-thien', async (req: any, res, next) => {
  try {
    const { targetId } = z.object({ targetId: z.string() }).parse(req.body);
    const profile = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId }, include: { fields: true, skills: true } });
    if (!profile) throw new AppError(400, 'Chưa có hồ sơ');
    const target = await prisma.jobTarget.findFirst({ where: { id: targetId, profileId: profile.id } });
    if (!target) throw new AppError(404, 'Không thấy tin tuyển dụng');
    const goc = await prisma.cvDocument.findFirst({ where: { profileId: profile.id, isOriginal: true } });
    const hts = await prisma.hoSoHoanThien.findMany({ where: { profileId: profile.id } });
    const bullets = hts.filter((h: any) => h.goiY).map((h: any) => String(h.goiY));
    const text = await composeCV({ title: target.title, goc: goc?.parsedText, fields: profile.fields, skills: profile.skills.map((s: any) => s.skillCode), bullets });
    const label = 'CV hoàn thiện · ' + (target.title || 'vị trí');
    const doc = await prisma.cvDocument.create({ data: { profileId: profile.id, isOriginal: false, targetId, label, parsedText: text } });
    res.json({ id: doc.id, label: doc.label, parsedText: doc.parsedText });
  } catch (e) { next(e); }
});

// POST /api/profile/cv/:id/dat-goc ─ khách QUYẾT ĐỊNH lấy bản này ghi đè bản gốc
cvParseRouter.post('/cv/:id/dat-goc', async (req: any, res, next) => {
  try {
    const profile = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId } });
    if (!profile) throw new AppError(400, 'Chưa có hồ sơ');
    const doc = await prisma.cvDocument.findFirst({ where: { id: req.params.id, profileId: profile.id } });
    if (!doc) throw new AppError(404, 'Không thấy CV');
    const goc = await prisma.cvDocument.findFirst({ where: { profileId: profile.id, isOriginal: true } });
    if (goc) await prisma.cvDocument.update({ where: { id: goc.id }, data: { parsedText: doc.parsedText } });
    else await prisma.cvDocument.create({ data: { profileId: profile.id, isOriginal: true, label: 'CV gốc', parsedText: doc.parsedText } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// PUT /api/profile/cv/:id ─ sửa nội dung / đổi tên bản CV
cvParseRouter.put('/cv/:id', async (req: any, res, next) => {
  try {
    const b = z.object({ parsedText: z.string().optional(), label: z.string().optional() }).parse(req.body);
    const profile = await prisma.jobProfile.findUnique({ where: { userId: req.user.userId } });
    if (!profile) throw new AppError(400, 'Chưa có hồ sơ');
    const doc = await prisma.cvDocument.findFirst({ where: { id: req.params.id, profileId: profile.id } });
    if (!doc) throw new AppError(404, 'Không thấy CV');
    await prisma.cvDocument.update({ where: { id: doc.id }, data: { parsedText: b.parsedText ?? doc.parsedText, label: b.label ?? doc.label } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
