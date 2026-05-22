/**
 * SilentCompanionshipWidgets — các widget chính cho Sol mới.
 *
 * 4 widget:
 *   1. ControlScoreWidget    — Chỉ Số Làm Chủ 0-100 (3 thành phần: Hiểu mình, Trì hoãn, Quay lại)
 *   2. AnonymousStatsWidget  — "Tuần này trong Sol" — số liệu cộng đồng ẩn danh
 *   3. QuickWinDay3Widget    — Báo cáo Ngày 3 — anh hút thế nào
 *   4. CrisisTriggerButton   — "Tôi đang thèm" (mở modal Đợi 90 giây)
 *
 * LƯU Ý: chỉ số làm chủ là chỉ số NỘI BỘ Sol — không claim khoa học.
 * Tham khảo, không thay xét nghiệm y khoa.
 */

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CrisisTimerModal } from './CrisisTimerModal';

// ─── 1. Control Score Widget ────────────────────────────────────────────
export function ControlScoreWidget() {
  const [data, setData] = useState<{
    totalScore: number;
    level: string;
    components: { hieuMinh: number; triHoan: number; quayLai: number };
  } | null>(null);

  useEffect(() => {
    api.controlScore().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const pct = data.totalScore;
  const levelColor =
    pct >= 80 ? '#2E7D32' : pct >= 60 ? '#558B2F' : pct >= 40 ? '#B8860B' : pct >= 20 ? '#B25C2C' : '#8A857C';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FFF4EA, #F5EFE3)',
        border: '1px solid #E8DFC8',
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: '#8A857C',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        Chỉ số làm chủ của anh
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: levelColor }}>{pct}</span>
        <span style={{ fontSize: 16, color: '#8A857C' }}>/100</span>
        <span style={{ fontSize: 14, color: levelColor, fontWeight: 600, marginLeft: 'auto' }}>
          {data.level}
        </span>
      </div>
      <div
        style={{
          background: '#E8DFC8',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: levelColor,
            transition: 'width 0.5s',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#5A5650' }}>
        <div>
          <div style={{ fontWeight: 600, color: '#5C3A1E' }}>Hiểu mình</div>
          <div>{data.components.hieuMinh}/33</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#5C3A1E' }}>Trì hoãn</div>
          <div>{data.components.triHoan}/33</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#5C3A1E' }}>Quay lại</div>
          <div>{data.components.quayLai}/33</div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Anonymous Stats Feed Widget ────────────────────────────────────
export function AnonymousStatsWidget() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.statsFeed().then((r) => setStats(r.stats)).catch(() => {});
  }, []);

  if (!stats) return null;

  const lines: string[] = [];
  if (stats.lateNightOpens > 0)
    lines.push(`${stats.lateNightOpens} anh em mở Sol sau 11h đêm`);
  if (stats.lapseLogs > 0) lines.push(`${stats.lapseLogs} anh em vừa hút lại tuần này`);
  if (stats.recoveryWithin24h > 0)
    lines.push(`${stats.recoveryWithin24h} anh em quay lại trong 24h`);
  if (stats.delayOver10min > 0)
    lines.push(`${stats.delayOver10min} anh em delay được cơn thèm hơn 10 phút`);
  if (stats.voiceListens > 0)
    lines.push(`${stats.voiceListens} lượt nghe Khang trong tuần`);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: '#2C2A27',
        color: '#F5EFE3',
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#C9BFA8',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 10,
          fontWeight: 600,
        }}
      >
        Tuần này trong Sol
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 14, lineHeight: 1.8 }}>
        {lines.map((line, i) => (
          <li key={i} style={{ paddingLeft: 16, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 0,
                color: '#B25C2C',
              }}
            >
              •
            </span>
            {line}
          </li>
        ))}
      </ul>
      <p
        style={{
          fontSize: 12,
          color: '#C9BFA8',
          marginTop: 12,
          marginBottom: 0,
          fontStyle: 'italic',
        }}
      >
        Anh không phải người duy nhất.
      </p>
    </div>
  );
}

// ─── 3. Quick Win Day 3 Widget ─────────────────────────────────────────
export function QuickWinDay3Widget() {
  const [data, setData] = useState<{
    daysSinceJoin: number;
    avgPerDay: number;
    totalLogged: number;
    topTriggers: { trigger: string; count: number; pct: number }[];
    vulnerableHourRange: string | null;
    message: string;
  } | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    api
      .quickWinDay3()
      .then((d: any) => {
        // Day 9 (2026-05-22): backend trả 200 + available:false thay vì 400
        if (d && d.available === false) setUnavailable(true);
        else setData(d);
      })
      .catch((err: any) => {
        if (err.status === 400 || err.status === 403) setUnavailable(true);
      });
  }, []);

  if (unavailable || !data) return null;

  return (
    <div
      style={{
        background: 'white',
        border: '2px solid #B25C2C',
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 2px 12px rgba(178,92,44,0.12)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#B25C2C',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        ⭐ Báo cáo 3 ngày của anh
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14.5, color: '#2C2A27', lineHeight: 1.7 }}>
          Anh hút trung bình{' '}
          <strong style={{ color: '#B25C2C', fontSize: 17 }}>{data.avgPerDay} điếu/ngày</strong>
        </div>
        {data.topTriggers.length > 0 && (
          <div style={{ fontSize: 14.5, color: '#2C2A27', lineHeight: 1.7, marginTop: 4 }}>
            Top trigger:{' '}
            {data.topTriggers
              .map((t) => `${t.trigger} (${t.pct}%)`)
              .join(', ')}
          </div>
        )}
        {data.vulnerableHourRange && (
          <div style={{ fontSize: 14.5, color: '#2C2A27', lineHeight: 1.7, marginTop: 4 }}>
            Khoảnh khắc dễ tổn thương nhất:{' '}
            <strong>{data.vulnerableHourRange}</strong>
          </div>
        )}
      </div>
      <p
        style={{
          fontSize: 14,
          color: '#5C3A1E',
          fontStyle: 'italic',
          margin: 0,
          padding: '10px 12px',
          background: '#FFF4EA',
          borderRadius: 8,
          textAlign: 'center',
        }}
      >
        {data.message}
      </p>
    </div>
  );
}

// ─── 5. Day 7 Full Report Widget ───────────────────────────────────────
export function Day7ReportWidget() {
  const [data, setData] = useState<any | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    api
      .day7Report()
      .then((d: any) => {
        if (d && d.available === false) setUnavailable(true);
        else setData(d);
      })
      .catch((err: any) => {
        if (err.status === 400 || err.status === 403) setUnavailable(true);
      });
  }, []);

  if (unavailable || !data) return null;

  return (
    <div
      style={{
        background: 'white',
        border: '2px solid #B8860B',
        borderRadius: 14,
        padding: 22,
        marginBottom: 16,
        boxShadow: '0 2px 12px rgba(184,134,11,0.15)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#B8860B',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        ⭐ Báo cáo 7 ngày của anh
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14.5, color: '#2C2A27', lineHeight: 1.7 }}>
          Trung bình{' '}
          <strong style={{ color: '#B8860B', fontSize: 17 }}>{data.avgPerDay} điếu/ngày</strong>{' '}
          ({data.totalLogged} điếu đã ghi)
        </div>
        {data.topTriggers && data.topTriggers.length > 0 && (
          <div style={{ fontSize: 14.5, color: '#2C2A27', lineHeight: 1.7, marginTop: 6 }}>
            <strong>5 trigger lớn nhất:</strong>{' '}
            {data.topTriggers
              .map((t: any) => `${t.trigger} (${t.pct}%)`)
              .join(', ')}
          </div>
        )}
        {data.topHours && data.topHours.length > 0 && (
          <div style={{ fontSize: 14.5, color: '#2C2A27', lineHeight: 1.7, marginTop: 6 }}>
            <strong>3 khoảnh khắc tổn thương nhất:</strong>{' '}
            {data.topHours.map((h: any) => `${h.hour}h-${h.hour + 1}h`).join(', ')}
          </div>
        )}
      </div>
      <p
        style={{
          fontSize: 14,
          color: '#5C3A1E',
          fontStyle: 'italic',
          margin: '0 0 14px',
          padding: '12px 14px',
          background: '#FFF4EA',
          borderRadius: 8,
          textAlign: 'center',
        }}
      >
        {data.message}
      </p>
      {data.nextStep && (
        <a
          href={data.nextStep.ctaUrl}
          style={{
            display: 'block',
            textAlign: 'center',
            background: '#B25C2C',
            color: 'white',
            padding: '12px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {data.nextStep.title} →
        </a>
      )}
    </div>
  );
}

// ─── 6. Day 14 Full Report Widget ──────────────────────────────────────
export function Day14ReportWidget() {
  const [data, setData] = useState<any | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    api
      .day14Report()
      .then((d: any) => {
        if (d && d.available === false) setUnavailable(true);
        else setData(d);
      })
      .catch((err: any) => {
        if (err.status === 400 || err.status === 403) setUnavailable(true);
      });
  }, []);

  if (unavailable || !data) return null;

  return (
    <div
      style={{
        background: 'white',
        border: '2px solid #5C3A1E',
        borderRadius: 14,
        padding: 22,
        marginBottom: 16,
        boxShadow: '0 4px 16px rgba(92,58,30,0.15)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#5C3A1E',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        🎯 Báo cáo 14 ngày Sol Start
      </div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 11, color: '#8A857C' }}>Baseline</div>
          <div style={{ fontSize: 22, color: '#5A5650', fontWeight: 700 }}>
            {data.baselineAvgPerDay}
          </div>
          <div style={{ fontSize: 11, color: '#8A857C' }}>điếu/ngày</div>
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 11, color: '#8A857C' }}>Hiện tại</div>
          <div style={{ fontSize: 22, color: '#2E7D32', fontWeight: 700 }}>
            {data.currentAvgPerDay}
          </div>
          <div style={{ fontSize: 11, color: '#8A857C' }}>điếu/ngày</div>
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 11, color: '#8A857C' }}>Giảm</div>
          <div style={{ fontSize: 22, color: '#B25C2C', fontWeight: 700 }}>
            {data.reductionPct}%
          </div>
          <div style={{ fontSize: 11, color: '#8A857C' }}>so baseline</div>
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: '#5A5650', marginBottom: 14, lineHeight: 1.7 }}>
        ✓ {data.crisisAttempts} lần Crisis Timer (delay TB {Math.round(data.avgDelaySec / 60)}{' '}
        phút)
        <br />✓ {data.lightDays} ngày hút {'<'} 50% baseline
      </div>
      <p
        style={{
          fontSize: 14,
          color: '#5C3A1E',
          fontStyle: 'italic',
          margin: '0 0 14px',
          padding: '12px 14px',
          background: '#FFF4EA',
          borderRadius: 8,
          textAlign: 'center',
        }}
      >
        {data.message}
      </p>
      {data.nextStep && (
        <a
          href={data.nextStep.ctaUrl}
          style={{
            display: 'block',
            textAlign: 'center',
            background: '#B25C2C',
            color: 'white',
            padding: '12px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {data.nextStep.title} →
        </a>
      )}
    </div>
  );
}

// ─── 4. Crisis Trigger Button ──────────────────────────────────────────
export function CrisisTriggerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #B25C2C, #8B2D2D)',
          color: 'white',
          border: 'none',
          padding: '14px 20px',
          borderRadius: 12,
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(178,92,44,0.25)',
        }}
      >
        🚭 Tôi đang thèm — Khang ngồi cùng 90s
      </button>
      <CrisisTimerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
