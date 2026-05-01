// frontend/src/components/RecoveryCodeModal.tsx
//
// Hiện mã khôi phục 1 LẦN — sau khi user bind Zalo/SĐT lần đầu hoặc sau khi
// recover thành công. Force user xác nhận "Đã lưu" trước khi đóng — không có
// nút X. Mục đích: ép user dừng lại lưu thật, không bấm X cho qua.

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
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-4 py-3 bg-sol-orange text-white">
          <div className="text-base font-bold flex items-center gap-2">
            <span>🔑</span>
            <span>Mã khôi phục của bạn</span>
          </div>
          <div className="text-[11px] opacity-90 mt-0.5">
            Chỉ hiện 1 LẦN — không xem lại được
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Mã - hiển thị to, dễ chép */}
          <div
            className="font-mono text-lg font-bold text-center text-sol-ink py-3 px-2 rounded-lg bg-sol-paper border-2 border-sol-orange/40 tracking-wider select-all"
          >
            {code}
          </div>

          <button
            onClick={copy}
            className="w-full py-2 rounded-lg bg-sol-green text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            {copied ? '✓ Đã copy' : '📋 Copy mã'}
          </button>

          {/* Hướng dẫn save */}
          <div className="text-xs text-sol-ink/75 leading-relaxed bg-sol-paper rounded-lg p-3 border border-sol-line">
            <div className="font-semibold mb-1">Mã này CỨU bạn nếu:</div>
            <ul className="list-disc pl-4 space-y-0.5 text-sol-ink/65">
              <li>Mất phone và Zalo cùng lúc</li>
              <li>Đổi số ĐT mà SIM cũ đã mất</li>
              <li>Account bị khoá tạm thời</li>
            </ul>
            <div className="font-semibold mt-2 mb-1">Lưu ngay:</div>
            <ul className="list-disc pl-4 space-y-0.5 text-sol-ink/65">
              <li>Chụp màn hình → ảnh cá nhân</li>
              <li>Hoặc ghi vào sổ tay/ví</li>
              <li>Hoặc gửi email cho chính mình</li>
            </ul>
          </div>

          {/* Force confirm checkbox */}
          <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-sol-paper transition">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-sol-green"
            />
            <span className="text-sm text-sol-ink leading-snug">
              Tôi đã lưu mã này vào nơi an toàn. Tôi hiểu mã sẽ không hiện lại.
            </span>
          </label>

          <button
            disabled={!confirmed}
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-sol-orange text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmed ? '✓ Đóng' : 'Tick xác nhận để đóng'}
          </button>
        </div>
      </div>
    </div>
  );
}
