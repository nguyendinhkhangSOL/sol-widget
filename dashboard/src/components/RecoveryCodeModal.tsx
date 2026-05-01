// dashboard/src/components/RecoveryCodeModal.tsx
// Layer 3: hiện mã khôi phục 1 lần sau khi user bind identity. Force confirm.

import { useState } from 'react';

interface Props {
  code: string;
  onClose: () => void;
}

export function RecoveryCodeModal({ code, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mã khôi phục"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md sol-card-padded">
        <div className="flex items-center gap-2 text-sol-orange-ink mb-1">
          <span className="text-2xl">🔑</span>
          <h3 className="text-h3 font-bold text-sol-ink">
            Mã khôi phục của bạn
          </h3>
        </div>
        <div className="text-meta text-sol-ink-3 mb-4">
          Chỉ hiện 1 LẦN — không xem lại được
        </div>

        {/* Mã to + dễ chép */}
        <div className="font-mono text-2xl font-bold text-center text-sol-ink py-4 px-3 rounded-xl bg-sol-paper border-2 border-sol-orange/40 tracking-wider select-all mb-3">
          {code}
        </div>

        <button onClick={copy} className="sol-btn-primary w-full mb-4">
          {copied ? '✓ Đã copy' : '📋 Copy mã'}
        </button>

        <div className="text-meta text-sol-ink-2 leading-relaxed bg-sol-paper rounded-xl p-3 border border-sol-line mb-4">
          <div className="font-semibold text-sol-ink mb-1">
            Mã này CỨU bạn nếu:
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-sol-ink-2">
            <li>Mất phone và Zalo cùng lúc</li>
            <li>Đổi số ĐT mà SIM cũ đã mất</li>
            <li>Account bị khoá tạm thời</li>
          </ul>
          <div className="font-semibold text-sol-ink mt-3 mb-1">Lưu ngay:</div>
          <ul className="list-disc pl-5 space-y-0.5 text-sol-ink-2">
            <li>Chụp màn hình → ảnh cá nhân</li>
            <li>Hoặc ghi vào sổ tay/ví</li>
            <li>Hoặc gửi email cho chính mình</li>
          </ul>
        </div>

        <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-sol-soft mb-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-sol-green"
          />
          <span className="text-meta text-sol-ink leading-snug">
            Tôi đã lưu mã này vào nơi an toàn. Tôi hiểu mã sẽ không hiện lại.
          </span>
        </label>

        <button
          disabled={!confirmed}
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-sol-orange text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {confirmed ? '✓ Đóng' : 'Tick xác nhận để đóng'}
        </button>
      </div>
    </div>
  );
}
