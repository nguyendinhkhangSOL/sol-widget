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
- "skills" CHỈ được chọn từ danh sách MÃ dưới đây, không tự bịa mã. Chọn tối đa 8 mã đúng nhất với CV.
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

    // 3) trả hồ sơ mới (gom 4 khối) để FE vẽ lại
    const full = await prisma.jobProfile.findUnique({ where: { id: profile.id }, include: { fields: true, skills: true } });
    const khoi: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const f of full!.fields) khoi[f.blockNo]?.push(f);
    res.json({ ok: true, filled, skillsAdded: skills.length, profile: { id: full!.id, khoi, skills: full!.skills } });
  } catch (e) { next(e); }
});
