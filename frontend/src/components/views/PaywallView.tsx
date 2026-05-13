// frontend/src/components/views/PaywallView.tsx
// Sol v4 (13-05-2026) — Paywall widget cho chặng tiếp theo trong lộ trình.
// 3 trang: T1 Khang's story → T2 chặng tiếp + tính năng → T3 thanh toán.
//
// LƯU Ý: Sol v4 unified — paywall này CHỈ hỏi "mở chặng tiếp theo" trong lộ trình
// của anh (KHOI_DONG hoặc DONG_HANH). Để chọn LỘ TRÌNH (Nhẹ/Vừa/Nặng) + 4 cách
// trả tiền linh hoạt, user vào /pricing dashboard có CohortPicker đầy đủ.
//
// Logic mở chặng tiếp:
//   - effectiveTier === FREE  → mở chặng Kiểm Soát
//   - effectiveTier === KHOI_DONG → mở chặng Làm Chủ
//   - khác → coi như đã ở trên đó, fall back về Home.

import { useEffect, useState } from 'react';
import { useStore } from '../../state/store';
import { api } from '../../services/api';
import type { TierCatalog, UserTier } from '../../types';
import { formatVnd, TIER_COLOR } from '../../lib/featureGates';

export function PaywallView() {
  const user = useStore((s) => s.user);
  const setView = useStore((s) => s.setView);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [catalog, setCatalog] = useState<TierCatalog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effective = user?.effectiveTier ?? 'FREE';
  const target: Exclude<UserTier, 'FREE' | 'ALUMNI'> =
    effective === 'FREE' ? 'KHOI_DONG' : 'DONG_HANH';

  useEffect(() => {
    api.getTierCatalog().then(setCatalog).catch(() => {});
  }, []);

  if (effective === 'DONG_HANH' || effective === 'ALUMNI') {
    // Không có gì cao hơn để bán
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-3xl mb-2">✨</div>
          <div className="font-semibold">Bạn đang ở gói cao nhất</div>
          <div className="text-sm text-sol-ink-2 mt-1">
            Tiếp tục đi cho đến đích nhé.
          </div>
          <button
            className="btn-primary mt-4"
            onClick={() => setView('greeting')}
          >
            Về trang chính
          </button>
        </div>
      </div>
    );
  }

  const targetItem = catalog?.tiers.find((t) => t.id === target);
  const targetColor = TIER_COLOR[target];

  async function pay() {
    setSubmitting(true);
    setError(null);
    try {
      await api.checkout(target, 'mock');
      // Reload user để cập nhật tier
      const me = await api.getMe();
      useStore.getState().setUser(me);
      setView('greeting');
    } catch (err: any) {
      setError(err?.body?.error ?? 'payment_failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto bg-gradient-to-b from-white to-sol-paper">
      {step === 0 && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-3">
            <div className="text-3xl mb-2">🌱</div>
            <h2 className="text-base font-bold text-sol-ink leading-tight">
              Khang đã từng ở đây
            </h2>
            <p className="text-xs text-sol-ink-2 mt-1">
              30 năm ngồi với điếu thuốc — 5 năm sạch
            </p>
          </div>
          <div className="flex-1 bg-white rounded-2xl border border-sol-line p-4 text-sm leading-relaxed text-sol-ink-2 space-y-3">
            <p>
              "Mình đã thử bỏ thuốc 7 lần. 6 lần đầu thất bại — vì
              <span className="font-semibold text-sol-ink"> những ngày đầu mình một mình.</span>
            </p>
            <p>
              Lần cuối, mình ghi sổ tay mỗi ngày, có người bên cạnh hỏi
              han mỗi sáng. Vượt qua được 10 ngày — phần còn lại
              dễ hơn nhiều."
            </p>
            <p className="text-sol-ink font-semibold">
              — Khang Sol, founder bothuocla.sol.vn
            </p>
          </div>
          <button
            className="mt-4 w-full py-3 rounded-xl text-white font-semibold"
            style={{ background: targetColor.bg }}
            onClick={() => setStep(1)}
          >
            Xem cách Khang đồng hành →
          </button>
        </div>
      )}

      {step === 1 && targetItem && (
        <div className="flex-1 flex flex-col">
          <h2 className="text-base font-bold text-center mb-1">
            Mở chặng {targetItem.label}
          </h2>
          <p className="text-xs text-sol-ink-2 text-center mb-3">
            {target === 'KHOI_DONG'
              ? 'Chặng giảm tần suất hút. Sol bên anh suốt chặng này.'
              : 'Chặng bỏ thật + bảo vệ thành quả. Khang giữ lời — hoàn tiền nếu anh cần dừng.'}
          </p>
          <div
            className="flex-1 rounded-2xl border p-4"
            style={{ background: targetColor.light, borderColor: targetColor.bg + '55' }}
          >
            <ul className="space-y-2">
              {targetItem.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-sol-ink leading-snug">
                  <span style={{ color: targetColor.bg }}>✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {targetItem.refundable && (
              <div className="mt-3 pt-3 border-t border-black/5 text-xs text-sol-ink-2">
                💰 Hoàn tiền theo tỷ lệ ngày còn lại — từ Ngày {targetItem.refundFromDay}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-2 rounded-xl border border-sol-line text-sm"
            >
              ← Quay lại
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-[2] py-2.5 rounded-xl text-white font-semibold"
              style={{ background: targetColor.bg }}
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {step === 2 && targetItem && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-4">
            <div className="text-xs uppercase tracking-wider text-sol-ink-3 font-semibold">
              Số tiền
            </div>
            <div
              className="text-4xl font-black mt-1 tabular-nums"
              style={{ color: targetColor.bg }}
            >
              {formatVnd(targetItem.priceVnd)}
            </div>
            <div className="text-xs text-sol-ink-2 mt-1">
              {targetItem.durationDays} ngày trải nghiệm đầy đủ
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-sol-line p-4 space-y-3">
            <div className="text-sm text-sol-ink-2">
              {target === 'KHOI_DONG'
                ? 'Chưa bằng 1 tuần thuốc. Khang ở bên anh suốt chặng Kiểm Soát.'
                : 'Anh đã đi qua chặng Kiểm Soát. Chặng Làm Chủ là tấm khiên bảo vệ thành quả.'}
            </div>
            <div className="text-meta text-sol-ink-3">
              💡 Muốn linh hoạt hơn? Sol có <strong>3 lộ trình × 4 cách trả tiền</strong>{' '}
              (Trả Thử / Trả Theo Tuần / Trả Một Lần / Trả Sau Khi Thành Công){' '}
              — anh vào trang Giá xem.
            </div>
            <div className="text-meta text-sol-ink-3">
              Đợt thanh toán mock — không tính phí thật. Khi triển khai
              MoMo/VietQR sẽ chuyển sang trang quét QR.
            </div>
          </div>

          {error && (
            <div className="mt-3 text-sm text-sol-red bg-sol-red-soft border border-sol-red/30 rounded-xl p-3">
              Có lỗi: {error}. Thử lại nhé.
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep(1)}
              disabled={submitting}
              className="flex-1 py-2 rounded-xl border border-sol-line text-sm"
            >
              ← Quay lại
            </button>
            <button
              onClick={pay}
              disabled={submitting}
              className="flex-[2] py-2.5 rounded-xl text-white font-semibold disabled:opacity-60"
              style={{ background: targetColor.bg }}
            >
              {submitting
                ? 'Đang xử lý…'
                : `Thanh toán ${formatVnd(targetItem.priceVnd)}`}
            </button>
          </div>

          <button
            onClick={() => setView('greeting')}
            className="mt-2 text-xs text-sol-ink-3 underline"
          >
            Để lúc khác
          </button>
        </div>
      )}
    </div>
  );
}
