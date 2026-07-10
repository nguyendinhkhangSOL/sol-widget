// ═══════════════════════════════════════════════════════════════
// EXTRACT 36 direction từ buoc3.html inline JS
// Run: npx ts-node extract-from-buoc3.ts [path-to-buoc3.html]
// Output: directions-extracted.json
// ═══════════════════════════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';

// Cluster mapping: category → cluster archetype
// A = Chuyên môn B2B Bán thời gian
// B = Chuyên gia Chia sẻ
// C = Sản phẩm Số / Cộng đồng
// D = Tech / SaaS / Product
// E = Đầu tư / Đại lý / Nhượng quyền
// F = Retail / Physical / Local
const CLUSTER_BY_ID: Record<string, string> = {
  // Chuyên môn — mostly A, IT = D
  'freelancer-ke-toan': 'A',
  'freelancer-marketing': 'A',
  'freelancer-thiet-ke': 'A',
  'freelancer-it': 'D',
  'tu-van-kinh-doanh': 'A',
  'tu-van-nhan-su': 'A',
  'tu-van-phap-ly': 'A',
  'freelancer-bien-dich': 'A',
  'tu-van-xuat-nhap-khau': 'A',
  // Đào tạo — B/C
  'coaching-ca-nhan': 'B',
  'workshop-chuyen-mon': 'B',
  'gia-su-chuyen-mon': 'B',
  'khoa-hoc-online': 'C',
  'corporate-training': 'B',
  // Nội dung số — B/C
  'blog-chuyen-nganh': 'B',
  'youtube-podcast': 'B',
  'ebook-tai-lieu-so': 'C',
  'newsletter': 'B',
  'smm-freelancer': 'B',
  // Kinh doanh — F
  'kinh-doanh-online': 'F',
  'thuc-pham-dac-san': 'F',
  'nong-san-sach': 'F',
  'dich-vu-dia-phuong': 'F',
  'kinh-doanh-fb': 'F',
  'dropshipping': 'F',
  // Đại lý — E
  'dai-ly-bao-hiem': 'E',
  'moi-gioi-bat-dong-san': 'E',
  'sales-b2b': 'E',
  'ctv-tiep-thi': 'E',
  // Dịch vụ — F
  'dich-vu-suc-khoe': 'F',
  'sua-chua-bao-tri': 'F',
  'cham-soc-lam-dep': 'F',
  'nhiep-anh-quay-phim': 'F',
  // Đầu tư — E
  'affiliate-marketing': 'E',
  'cho-thue-tai-san': 'E',
  'thiet-ke-noi-that': 'A', // hybrid — treat as B2B service
};

// Business type inference
const BUSINESS_TYPE_BY_CATEGORY: Record<string, string> = {
  chuyenmon: 'B2B',
  daotao: 'B2C',
  noidungso: 'B2C',
  kinhdoanh: 'B2C',
  daily: 'B2B2C',
  dichvu: 'B2C',
  dauthu: 'B2C',
};

// Revenue model inference
const REVENUE_MODEL_BY_CATEGORY: Record<string, string[]> = {
  chuyenmon: ['project', 'subscription'],
  daotao: ['one-time', 'subscription'],
  noidungso: ['ads', 'affiliate', 'subscription'],
  kinhdoanh: ['one-time', 'wholesale'],
  daily: ['commission', 'royalty'],
  dichvu: ['one-time', 'subscription'],
  dauthu: ['royalty', 'passive'],
};

interface RawDirection {
  id: string;
  title: string;
  emoji: string;
  cat: string;
  catLbl: string;
  isNew: boolean;
  desc: string;
  p: { people: number; expert: number; builder: number; independent: number };
  r: { capital: number; time: number; technology: number; network: number; risk: number; energy: number };
  b: { income_speed: number };
  income: { min: number; max: number };
  timeline: string;
  roadmap: Array<{ w: string; t: string; d: string }>;
  reasons: string[];
}

/**
 * Parse buoc3.html inline JS DB=[...] array
 * Returns array of RawDirection objects
 */
function parseBuoc3Html(htmlPath: string): RawDirection[] {
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Find DB=[...] block
  const dbMatch = html.match(/const\s+DB\s*=\s*\[([\s\S]*?)^\];/m);
  if (!dbMatch) {
    throw new Error('Cannot find DB=[...] block in buoc3.html');
  }

  const dbContent = dbMatch[1];

  // Split by lines starting with { and ending with },
  // Each direction is 1 line in original
  const lines = dbContent
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('{id:'))
    .map(l => l.replace(/,$/, '')); // Remove trailing comma

  const directions: RawDirection[] = [];
  for (const line of lines) {
    try {
      // Convert JS object literal to JSON: quote keys, remove trailing commas
      const jsonStr = line
        // Quote unquoted keys
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
        // Handle isNew:true/false already OK
        // Convert single quotes to double quotes (careful with escape)
        .replace(/'/g, '"');

      const obj = JSON.parse(jsonStr) as RawDirection;
      directions.push(obj);
    } catch (e) {
      console.error(`Failed to parse: ${line.substring(0, 100)}...`);
      console.error(e);
    }
  }

  return directions;
}

/**
 * Transform raw direction → Prisma Direction shape
 * Preserve all 14 legacy fields, add sensible defaults for new fields
 */
function transformToPrismaShape(raw: RawDirection) {
  const cluster = CLUSTER_BY_ID[raw.id] || 'A';
  const businessType = BUSINESS_TYPE_BY_CATEGORY[raw.cat] || 'B2C';
  const revenueModel = REVENUE_MODEL_BY_CATEGORY[raw.cat] || ['one-time'];

  return {
    // ─── IDENTITY ────────────────────────────────────────
    id: raw.id,
    slug: raw.id,
    title: raw.title,
    emoji: raw.emoji,
    cluster,
    category: raw.cat,
    categoryLabel: raw.catLbl,
    isNew: raw.isNew,
    desc: raw.desc,

    // ─── LEGACY 14 FIELDS (BẢO TOÀN 100%) ────────────────
    pFit: {
      people: raw.p.people,
      expert: raw.p.expert,
      builder: raw.p.builder,
      independent: raw.p.independent,
    },
    rReq: {
      capital: raw.r.capital,
      time: raw.r.time,
      tech: raw.r.technology,
      network: raw.r.network,
      risk: raw.r.risk,
      energy: raw.r.energy,
    },
    bonus: { income_speed: raw.b.income_speed },
    income: { min: raw.income.min, max: raw.income.max },
    timeline: raw.timeline,
    reasons: raw.reasons,
    roadmap4Tuan: raw.roadmap, // Preserve legacy 4-week roadmap

    // ─── NHÓM 1: TAG & FILTER (defaults, admin fill later) ─
    tags: [],
    keywords: [],
    industryVerticals: null,
    regionSuitability: null,
    genderTilt: 'neutral',

    // ─── NHÓM 2: USER MATCHING (defaults) ────────────────
    nangKhieuUuTien: null,
    tinhCachPhaHop: null,
    mucDoHocHoi: 'medium',
    mucDoRuiRoDauTu: raw.r.risk <= 20 ? 'conservative' : raw.r.risk <= 50 ? 'moderate' : 'aggressive',

    // ─── NHÓM 3: BUSINESS MODEL (inferred) ───────────────
    businessType,
    revenueModel,
    scaleType: 'solo',
    remotePossibility: raw.cat === 'kinhdoanh' || raw.cat === 'dichvu' ? 20 : 80,
    travelRequired: raw.cat === 'daily' || raw.cat === 'dichvu' ? 60 : 20,

    // ─── NHÓM 4: TIME / SUCCESS / PREREQUISITES ──────────
    hoursPerWeek: { min: 20, max: 40, typical: 30 },
    timeToFirstRevenue: raw.timeline,
    timeToStableIncome: null,
    chiSoThanhCong: null,
    chiSoThatBai: null,
    thietBiPhanMem: null,

    // ─── NHÓM 5: CROSS-LINK + MARKET ─────────────────────
    caseStudyIds: [],
    articleIds: [],
    promptIds: [],
    mucDoCanhTranh: 'medium',
    xuHuongThiTruong: 'stable',

    // ─── VN REALITY (null — admin fill) ──────────────────
    soNamNgheToiThieu: null,
    ketQuaCuTheYeuCau: null,
    bufferThang: null,
    phapLyMaNganh: null,
    thueKhoanPercent: null,
    chungChiBatBuoc: null,
    chiPhiVnDiaChi: null,
    rangBuocGiaDinh: null,
    vanHoaBanHangVn: null,
    ruiRoTuoi40_60: null,

    // ─── ROADMAP 12 TUẦN (null — sinh sau) ───────────────
    roadmap12Tuan: null,
    giaiDoan3TieuDe: null,

    // ─── SAI LẦM + FRAMEWORK ─────────────────────────────
    saiLam5: null,
    solActiveFramework: null,
    congCu10: null,

    // ─── AI 2026 ─────────────────────────────────────────
    aiDaNuot: null,
    aiChuaNuot: null,
    aiMoatScore: null,

    // ─── AUDIT TRAIL ─────────────────────────────────────
    nguonDataFounder: `Migrated from buoc3.html inline DB (2026-07-03). Legacy 14 fields preserved.`,
    nguonDataPublic: null,
    discountFactorFormula: null,
    networkConfirmedBy: null,

    // ─── EDITORIAL ───────────────────────────────────────
    status: 'PUBLISHED', // Match existing production state
    version: 1,
    publishedAt: new Date().toISOString(),
    lastEditedBy: 'seed-script',
    changeNote: 'Initial migration from buoc3.html',
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

function main() {
  const buoc3Path = process.argv[2] || path.join(
    __dirname,
    '../../../huongdi-phase2/buoc3.html'
  );

  console.log(`📖 Reading: ${buoc3Path}`);

  const raw = parseBuoc3Html(buoc3Path);
  console.log(`✅ Parsed ${raw.length} direction from buoc3.html`);

  const transformed = raw.map(transformToPrismaShape);

  const outputPath = path.join(__dirname, 'directions-extracted.json');
  fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));

  console.log(`✅ Wrote ${transformed.length} direction → ${outputPath}`);
  console.log(`\n📊 Summary by category:`);
  const byCat: Record<string, number> = {};
  raw.forEach(d => { byCat[d.cat] = (byCat[d.cat] || 0) + 1; });
  Object.entries(byCat).forEach(([cat, n]) => console.log(`  ${cat}: ${n}`));

  console.log(`\n📊 Summary by cluster:`);
  const byCluster: Record<string, number> = {};
  transformed.forEach(d => { byCluster[d.cluster] = (byCluster[d.cluster] || 0) + 1; });
  Object.entries(byCluster).forEach(([c, n]) => console.log(`  Cluster ${c}: ${n}`));
}

if (require.main === module) {
  main();
}

export { parseBuoc3Html, transformToPrismaShape };
