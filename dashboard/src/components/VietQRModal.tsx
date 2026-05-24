// dashboard/src/components/VietQRModal.tsx
//
// Day 5 (2026-05-21): Modal hiện VietQR + STK + nội dung CK sau khi user
// chọn gói trong /pricing. User quét QR → CK tay → Khang confirm sau.

import { useEffect, useState } from 'react';
import { useToast } from '../lib/toast';

interface VietQRPayload {
  paymentId: string;
  qrUrl: string;
  amount: number;
  content: string;
  bank: {
    name: string;
    bin: string;
    accountNumber: string;
    accountName: string;
  };
  pricing: {
    cohort: 'LIGHT' | 'MODERATE' | 'HEAVY';
    paymentMode: 'full' | 'weekly';
    totalDays: number;
    paidDays: number;
    dailyRate: number;
  };
  instructions: string[];
}

interface Props {
  payload: VietQRPayload | null;
  pronouns: string;
  onClose: () => void;
}

export function VietQRModal({ payload, pronouns, onClose }: Props) {
  const toast = useToast();
  const [qrLoaded, setQrLoaded] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!payload) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [payload, onClose]);

  if (!payload) return null;

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  function copy(text: string, label: string) {
    if (!navigator.clipboard) {
      toast.error('Trình duyệt không hỗ trợ copy tự động', '⚠️');
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => toast.success(`Đã copy ${label}`, '✓'),
      () => toast.error('Copy thất bại', '⚠️'),
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vietqr-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-sol-paper rounded-t-3xl md:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl
          animate-[toastIn_220ms_ease-out]"
      >
        {/* Header */}
        <div className="sticky top-0 bg-sol-paper border-b border-sol-line px-5 py-4 flex items-center justify-between">
          <h2 id="vietqr-title" className="text-h2 font-bold text-sol-ink">
            💳 Quét QR thanh toán
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="min-h-tap w-10 rounded-full text-xl text-sol-ink-3 hover:bg-sol-soft"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Bank info banner */}
          <div className="bg-sol-green-soft border border-sol-green rounded-xl p-3 text-meta text-sol-green-ink">
            <div className="font-semibold mb-1">{payload.bank.name} · STK {payload.bank.accountNumber}</div>
            <div>{payload.bank.accountName}</div>
          </div>

          {/* QR Image */}
          <div className="bg-white rounded-2xl p-4 border border-sol-line flex flex-col items-center">
            {!qrLoaded && (
              <div className="w-64 h-64 flex items-center justify-center text-sol-ink-3">
                <div className="animate-spin w-8 h-8 border-4 border-sol-green border-t-transparent rounded-full" />
              </div>
            )}
            <img
              src={payload.qrUrl}
              alt={`VietQR ${payload.bank.name} ${fmt(payload.amount)}đ`}
              className={`max-w-full h-auto ${qrLoaded ? 'block' : 'hidden'}`}
              onLoad={() => setQrLoaded(true)}
              onError={() => {
                setQrLoaded(true);
                toast.error('QR không tải được — dùng STK + nội dung CK bên dưới', '⚠️');
              }}
            />
            <p className="text-meta text-sol-ink-3 mt-3 text-center">
              Mở app ngân hàng → Quét QR
            </p>
          </div>

          {/* Manual transfer info (fallback) */}
          <div className="bg-sol-soft rounded-xl p-4 space-y-2">
            <div className="text-meta text-sol-ink-3 uppercase tracking-wide mb-1">
              Hoặc CK thủ công
            </div>

            <Row label="Ngân hàng" value={payload.bank.name} />

            <Row
              label="Số tài khoản"
              value={payload.bank.accountNumber}
              onCopy={() => copy(payload.bank.accountNumber, 'STK')}
            />

            <Row label="Tên TK" value={payload.bank.accountName} />

            <Row
              label="Số tiền"
              value={`${fmt(payload.amount)} đ`}
              valueClass="text-sol-orange-ink font-bold text-h3"
              onCopy={() => copy(String(payload.amount), 'số tiền')}
            />

            <Row
              label="Nội dung CK"
              value={payload.content}
              valueClass="font-mono font-bold text-sol-green-ink"
              onCopy={() => copy(payload.content, 'nội dung CK')}
            />
          </div>

          {/* Pricing summary */}
          <div className="border border-sol-line rounded-xl p-3 text-body text-sol-ink-2">
            <strong className="text-sol-ink">Lộ trình {payload.pricing.cohort === 'LIGHT' ? 'Nhẹ' : payload.pricing.cohort === 'HEAVY' ? 'Nặng' : 'Trung bình'}</strong> ·{' '}
            {payload.pricing.paymentMode === 'full'
              ? `${payload.pricing.totalDays} ngày (7 ngày miễn phí + ${payload.pricing.paidDays} × ${fmt(payload.pricing.dailyRate)}đ)`
              : `Trả góp tuần — 7 ngày × ${fmt(payload.pricing.dailyRate)}đ`}
          </div>

          {/* Instructions */}
          <ol className="space-y-2 text-body text-sol-ink-2 pl-5 list-decimal">
            {payload.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {/* Reassurance */}
          <div className="bg-sol-orange-soft/40 border-l-4 border-sol-orange rounded-r-lg p-3 text-meta text-sol-ink">
            <strong>Sòng phẳng:</strong> Sol KHÔNG lưu thẻ, KHÔNG tự trừ tiền.
            {pronouns === 'anh' ? ' Anh' : ` ${pronouns}`} chuyển khoản tay 1 lần — sau đó Khang xác nhận và mở lộ trình.
            Hoàn tiền ngày chưa dùng (sau ≥ 7 ngày Ngắt Cơn).
          </div>

          {/* Footer buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 sol-btn-secondary min-h-tap"
            >
              Đóng
            </button>
            <a
              href={`https://zalo.me/3049397094672064963`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sol-btn-primary min-h-tap text-center"
            >
              💬 Nhắn Khang qua Zalo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = 'text-sol-ink font-semibold',
  onCopy,
}: {
  label: string;
  value: string;
  valueClass?: string;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-meta text-sol-ink-2 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-body truncate ${valueClass}`}>{value}</span>
        {onCopy && (
          <button
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="flex-shrink-0 text-meta text-sol-blue hover:text-sol-blue-ink px-2 py-1 rounded hover:bg-sol-blue-soft"
          >
            📋
          </button>
        )}
      </div>
    </div>
  );
}
