'use client';

import { useRouter } from 'next/navigation';
import { formatVND, type Cohort, type CohortPlan } from '@/lib/ftnd';

interface Props {
  cohort: Cohort;
  phone: string;
  currentType: 'full' | 'weekly';
  plan: CohortPlan;
}

export function PaymentToggle({ cohort, phone, currentType, plan }: Props) {
  const router = useRouter();

  function switchType(type: 'full' | 'weekly') {
    router.push(`/thanh-toan?cohort=${cohort}&p=${phone}&type=${type}`);
  }

  return (
    <div className="card-sol mb-6">
      <p className="text-sm text-sol-ink2 mb-3 text-center">Chọn cách đóng phí:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Trọn gói */}
        <button
          onClick={() => switchType('full')}
          className={`p-4 rounded-xl border-2 text-left transition ${
            currentType === 'full'
              ? 'border-sol-orange bg-sol-cream'
              : 'border-sol-cream hover:border-sol-orange'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold text-sol-brown">Trọn gói</span>
            {currentType === 'full' && <span className="text-xs bg-sol-orange text-white px-2 py-0.5 rounded">ĐANG CHỌN</span>}
          </div>
          <p className="text-2xl font-bold text-sol-brown mb-1">{formatVND(plan.totalPrice)}</p>
          <p className="text-xs text-sol-ink2">
            {plan.paidDays} ngày × 5.000đ — tiết kiệm tối đa
          </p>
        </button>

        {/* Theo tuần */}
        <button
          onClick={() => switchType('weekly')}
          className={`p-4 rounded-xl border-2 text-left transition ${
            currentType === 'weekly'
              ? 'border-sol-orange bg-sol-cream'
              : 'border-sol-cream hover:border-sol-orange'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="font-semibold text-sol-brown">Góp phí theo tuần</span>
            {currentType === 'weekly' && <span className="text-xs bg-sol-orange text-white px-2 py-0.5 rounded">ĐANG CHỌN</span>}
          </div>
          <p className="text-2xl font-bold text-sol-brown mb-1">35.000đ <span className="text-sm font-normal text-sol-ink2">/tuần</span></p>
          <p className="text-xs text-sol-ink2">
            Linh hoạt — fail tuần nào dừng tuần đó
          </p>
        </button>
      </div>
    </div>
  );
}
