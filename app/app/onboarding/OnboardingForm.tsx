'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Cohort } from '@/lib/ftnd';

interface Props {
  cohort: Cohort;
  testResultId?: number;
}

export function OnboardingForm({ cohort, testResultId }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Quick client validation
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (!/^0\d{9,10}$/.test(cleanPhone)) {
      setError('SĐT không hợp lệ. Phải bắt đầu bằng 0 và có 10-11 số.');
      return;
    }
    if (fullName.trim().length < 2) {
      setError('Vui lòng nhập tên (ít nhất 2 ký tự).');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          full_name: fullName.trim(),
          cohort,
          test_result_id: testResultId,
          source: '31-5-campaign'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      // Track GA4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'sign_up', {
          method: 'phone',
          cohort
        });
      }

      // Redirect to dashboard / success page
      router.push(`/chao-mung?cohort=${cohort}&p=${cleanPhone}`);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="card-sol space-y-4">
        <div>
          <label htmlFor="phone" className="block font-semibold text-sol-brown mb-1.5">
            SĐT Zalo <span className="text-sol-orange">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xx xxx xxx"
            className="input-sol text-lg"
            disabled={submitting}
            autoComplete="tel"
            inputMode="numeric"
            autoFocus
          />
          <p className="text-xs text-sol-ink2 mt-1">
            🟦 SĐT này phải có Zalo — Khang sẽ kết bạn để support trực tiếp
          </p>
        </div>

        <div>
          <label htmlFor="fullName" className="block font-semibold text-sol-brown mb-1.5">
            Tên anh <span className="text-sol-orange">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            className="input-sol"
            disabled={submitting}
            autoComplete="name"
          />
          <p className="text-xs text-sol-ink2 mt-1">
            Để Khang gọi tên anh trong voice/email — không bán cho ai
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Đang xử lý...' : 'Bắt đầu 7 ngày MIỄN PHÍ →'}
        </button>

        <p className="text-xs text-sol-ink2 text-center">
          Bằng cách bắt đầu, anh đồng ý nhận tin nhắn Zalo từ Sol.
          Không SMS spam · Không auto-charge.
        </p>
      </form>
    </div>
  );
}
