// ═══════════════════════════════════════════════════════════════
// /api/directions/match-v2 — Top 3 personalization + WHY explain
// Path: /var/www/huongdi/backend/src/routes/match-v2.ts
// Mount: app.use('/api/directions', matchV2Router)
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Type helpers ────────────────────────────────────────────
interface P1Scores { people: number; expert: number; builder: number; independent: number }
interface P2Scores {
  experience: number; capital: number; time: number;
  technology: number; network: number; risk: number; energy: number;
}

interface MatchReason {
  factor: string;       // "P1_rank_expert" / "P2_high_experience" ...
  weight: number;       // Contribution to score (0-1)
  humanText: string;    // "Anh chị mạnh về chuyên môn (P/E 85 điểm)"
}

interface DirectionMatch {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: string;
  matchScore: number;      // 0-100
  matchReasons: MatchReason[];
  roadmapPreview: {
    stages: Array<{ day: string; title: string; locked: boolean }>;
    lockedCount: number;
  };
  caseStudyPreview: string | null;  // Anonymized case
  requiresTier: 'FREE' | 'ACTIVE' | 'FOUNDER';
  isLocked: boolean;
}

// ═══════════════════════════════════════════════════════════════
// POST /api/directions/match-v2
// Body: { p1: {...}, p2: {...}, userId?, sessionId?, limit? }
// Returns: Top N direction matches với explain WHY + preview
// ═══════════════════════════════════════════════════════════════
router.post('/match-v2', async (req: Request, res: Response) => {
  try {
    const { p1, p2, userId, sessionId, limit = 3 } = req.body || {};

    if (!p1 || !p2) {
      return res.status(400).json({ success: false, message: 'Cần cả P1 và P2 vector' });
    }

    // ─── Fetch all directions ──────────────────────────────────
    const directions = await prisma.direction.findMany({
      where: { status: 'PUBLISHED' } as any,
      orderBy: { name: 'asc' },
    });

    // Get user tier (optional)
    let userTier: string = 'FREE';
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true } as any,
      });
      if (user) userTier = (user as any).tier;
    }

    // ─── Score each direction ───────────────────────────────────
    const matches: DirectionMatch[] = directions.map(dir => {
      const { score, reasons } = calculateMatchScore(dir, p1, p2);
      const isLocked = shouldLockDirection(dir, userTier);

      return {
        id: dir.id,
        slug: (dir as any).slug || dir.id,
        name: (dir as any).name || 'Direction',
        shortDescription: (dir as any).shortDescription || (dir as any).description?.substring(0, 200) || '',
        category: (dir as any).category || 'CHUYEN_MON',
        matchScore: Math.round(score),
        matchReasons: reasons,
        roadmapPreview: buildRoadmapPreview(dir, userTier),
        caseStudyPreview: buildCaseStudyPreview(dir),
        requiresTier: isLocked ? 'ACTIVE' : 'FREE',
        isLocked,
      };
    });

    // Sort by score desc + take top N
    matches.sort((a, b) => b.matchScore - a.matchScore);
    const topMatches = matches.slice(0, limit);

    // ─── Log match event ────────────────────────────────────────
    if (sessionId || userId) {
      try {
        await (prisma as any).userEvent?.create({
          data: {
            userId: userId || null,
            sessionId: sessionId || 'anonymous',
            eventType: 'P3_VIEW',
            meta: {
              topDirection: topMatches[0]?.slug,
              matchScore: topMatches[0]?.matchScore,
              version: 'v2',
            },
          },
        });
      } catch (_) { /* silent */ }
    }

    return res.json({
      success: true,
      matches: topMatches,
      total: matches.length,
      userTier,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[POST /directions/match-v2]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SCORING LOGIC
// ═══════════════════════════════════════════════════════════════

function calculateMatchScore(
  direction: any,
  p1: P1Scores,
  p2: P2Scores,
): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  // ─── P1 DNA matching (weight 40%) ─────────────────────────
  const p1Rank = getP1Rank(p1);  // ['expert', 'independent', 'builder', 'people']
  const dirP1 = (direction as any).p1Requirements || (direction as any).p1Weights || {
    people: 50, expert: 50, builder: 50, independent: 50,
  };

  const p1Score = calcP1Match(p1, dirP1);
  totalScore += p1Score * 40;
  totalWeight += 40;

  // Explain WHY (top 2 strengths in P1)
  const p1Top = p1Rank[0];
  const p1TopScore = p1[p1Top as keyof P1Scores];
  if (p1TopScore >= 60) {
    reasons.push({
      factor: `P1_rank_${p1Top}`,
      weight: 0.4,
      humanText: `Anh chị mạnh về ${humanizeRank(p1Top)} (${p1TopScore} điểm) — direction này cần nhiều ${humanizeRank(p1Top).toLowerCase()}.`,
    });
  }

  // ─── P2 Resource matching (weight 45%) ─────────────────────
  const p2Score = calcP2Match(p2, direction);
  totalScore += p2Score * 45;
  totalWeight += 45;

  // P2 explain — pick 2 top matching resources
  const p2Sorted = Object.entries(p2 as any).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  );
  const p2Top = p2Sorted[0];
  if (p2Top && (p2Top[1] as number) >= 60) {
    reasons.push({
      factor: `P2_high_${p2Top[0]}`,
      weight: 0.3,
      humanText: `${humanizeResource(p2Top[0])} của anh chị cao (${p2Top[1]} điểm) — phù hợp direction này.`,
    });
  }

  // Warning nếu P2 vector nào quá thấp cần thiết
  const p2Low = p2Sorted[p2Sorted.length - 1];
  if (p2Low && (p2Low[1] as number) < 30) {
    // Chỉ warn nếu direction thực sự cần vector đó (skip cho MVP)
    // reasons.push({...});
  }

  // ─── Income goal alignment (weight 15%) ─────────────────────
  if ((p2 as any).incomeGoal) {
    const dirIncome = (direction as any).targetIncome || 'medium';
    const incomeMatch = matchIncome((p2 as any).incomeGoal, dirIncome);
    totalScore += incomeMatch * 15;
    totalWeight += 15;
  }

  const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 50;

  // Explain overall
  if (finalScore >= 85) {
    reasons.unshift({
      factor: 'overall_excellent',
      weight: 1,
      humanText: `Match ${Math.round(finalScore)}% — đây là top pick cho anh chị.`,
    });
  } else if (finalScore >= 70) {
    reasons.unshift({
      factor: 'overall_good',
      weight: 1,
      humanText: `Match ${Math.round(finalScore)}% — phù hợp tốt, có thể xem xét nghiêm túc.`,
    });
  }

  return { score: finalScore, reasons: reasons.slice(0, 3) };  // Top 3 reasons
}

function getP1Rank(p1: P1Scores): string[] {
  return Object.entries(p1 as any)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(e => e[0]);
}

function calcP1Match(p1: P1Scores, target: any): number {
  // Cosine-similarity-like giữa user P1 và direction requirement
  const keys = ['people', 'expert', 'builder', 'independent'] as const;
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    const a = p1[k] || 0;
    const b = target[k] || 50;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0.5;
}

function calcP2Match(p2: P2Scores, direction: any): number {
  // Direction có thể có "p2Requirements" trong data — fallback dùng average
  const req = direction.p2Requirements || {};
  const keys: (keyof P2Scores)[] = ['experience', 'capital', 'time', 'technology', 'network', 'risk', 'energy'];

  let matchSum = 0;
  let weightSum = 0;
  for (const k of keys) {
    const userVal = p2[k] || 0;
    const reqVal = req[k] || 50;
    const weight = req[`${k}_weight`] || 1;
    // Score cao nếu user đáp ứng đủ requirement
    const diff = userVal - reqVal;
    const contrib = diff >= 0 ? 1 : Math.max(0, 1 + diff / 100);
    matchSum += contrib * weight;
    weightSum += weight;
  }
  return weightSum > 0 ? matchSum / weightSum : 0.6;
}

function matchIncome(userGoal: string, dirTarget: string): number {
  const goalMap: Record<string, number> = {
    '2-5tr': 1, '5-15tr': 2, '15-30tr': 3, '30tr+': 4,
  };
  const targetMap: Record<string, number> = {
    'low': 1, 'medium': 2, 'high': 3, 'very-high': 4,
  };
  const uVal = goalMap[userGoal] || 2;
  const dVal = targetMap[dirTarget] || 2;
  const diff = Math.abs(uVal - dVal);
  return Math.max(0, 1 - diff * 0.25);
}

// ═══════════════════════════════════════════════════════════════
// HUMAN-READABLE HELPERS (Vietnamese)
// ═══════════════════════════════════════════════════════════════

function humanizeRank(rank: string): string {
  const map: Record<string, string> = {
    people: 'Kết nối Người',
    expert: 'Chuyên môn sâu',
    builder: 'Xây dựng hệ thống',
    independent: 'Độc lập tự chủ',
  };
  return map[rank] || rank;
}

function humanizeResource(res: string): string {
  const map: Record<string, string> = {
    experience: 'Kinh nghiệm',
    capital: 'Vốn',
    time: 'Thời gian',
    technology: 'Công nghệ',
    network: 'Network',
    risk: 'Khẩu vị rủi ro',
    energy: 'Năng lượng',
  };
  return map[res] || res;
}

// ═══════════════════════════════════════════════════════════════
// ROADMAP PREVIEW (5 giai đoạn, chỉ show 1 nếu FREE)
// ═══════════════════════════════════════════════════════════════

function buildRoadmapPreview(direction: any, userTier: string): DirectionMatch['roadmapPreview'] {
  const stages = (direction as any).roadmap || [
    { day: 'Ngày 1-14', title: 'Xác định thị trường + audience ngách' },
    { day: 'Ngày 15-30', title: 'Build sản phẩm/dịch vụ tối thiểu (MVP)' },
    { day: 'Ngày 31-60', title: 'Test với 5-10 khách đầu tiên' },
    { day: 'Ngày 61-75', title: 'Tune sản phẩm + pricing' },
    { day: 'Ngày 76-90', title: 'Scale lên 20-30 khách + xây moat' },
  ];

  const isFree = userTier === 'FREE';
  const previewStages = stages.map((s: any, idx: number) => ({
    day: s.day,
    title: s.title,
    locked: isFree && idx >= 1,
  }));

  return {
    stages: previewStages,
    lockedCount: isFree ? stages.length - 1 : 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// CASE STUDY PREVIEW (anonymized)
// ═══════════════════════════════════════════════════════════════

function buildCaseStudyPreview(direction: any): string | null {
  const preview = (direction as any).caseStudyPreview;
  if (preview) return preview;

  // Fallback template dựa direction category
  const category = (direction as any).category;
  const map: Record<string, string> = {
    CHUYEN_MON: 'Anh Bình 47t, kế toán trưởng SME 22 năm nghề — sau 90 ngày build brand LinkedIn: 3 khách retainer 15-25tr/tháng.',
    DAO_TAO: 'Chị Lan 44t, giáo viên tiếng Anh 18 năm — sau 90 ngày: khoá học online 2.5tr/khách × 30 học viên/tháng.',
    NOI_DUNG_SO: 'Anh Minh 42t, cựu content marketing agency — sau 90 ngày: 5000 follower Facebook + 2 sponsor 15tr/deal.',
    KINH_DOANH: 'Chị Hà 46t, mở shop online mỹ phẩm ngách — sau 90 ngày: doanh thu 40tr/tháng, biên 35%.',
    DAILY: 'Anh Tuấn 45t, dịch vụ vệ sinh máy lạnh — sau 90 ngày: 15 khách cố định × 500k/tháng.',
    DICH_VU: 'Chị Nga 48t, tư vấn setup phòng khám gia đình — sau 90 ngày: 3 dự án × 30tr.',
    DAU_TU: 'Anh Long 50t, đầu tư BĐS ngách văn phòng SME — sau 90 ngày: cho thuê 2 căn × 15tr/tháng.',
  };
  return map[category] || null;
}

// ═══════════════════════════════════════════════════════════════
// TIER LOCK LOGIC (5/37 free, 32/37 lock)
// ═══════════════════════════════════════════════════════════════

function shouldLockDirection(direction: any, userTier: string): boolean {
  if (userTier === 'ACTIVE' || userTier === 'FOUNDER') return false;
  // FREE tier: unlock chỉ 5 direction đầu (theo sortOrder hoặc featured)
  const isFeatured = (direction as any).isFeatured === true || (direction as any).featured === true;
  return !isFeatured;
}

export default router;
