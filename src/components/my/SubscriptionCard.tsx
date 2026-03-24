'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserSubscription } from '@/types/subscription';
import { PLAN_LABELS } from '@/types/subscription';
import CancelFlow from './CancelFlow';

interface SubscriptionCardProps {
  subscription: UserSubscription;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [showCancel, setShowCancel] = useState(false);
  const router = useRouter();
  const { plan, status, currentPeriodEnd } = subscription;

  const endDate = new Date(currentPeriodEnd);
  const dateLabel = currentPeriodEnd
    ? `${endDate.getFullYear()}. ${endDate.getMonth() + 1}. ${endDate.getDate()}`
    : '';

  const gradients: Record<string, string> = {
    free: 'from-gray-400 to-gray-500',
    standard: 'from-blue-500 to-indigo-500',
    premium: 'from-fuchsia-500 to-pink-500',
  };

  return (
    <div className="space-y-4">
      {/* 현재 플랜 카드 */}
      <div className={`rounded-2xl bg-gradient-to-br ${gradients[plan]} p-5 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/70">현재 플랜</p>
            <p className="mt-1 text-2xl font-black">{PLAN_LABELS[plan]}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
            status === 'active' ? 'bg-white/20 text-white' : 'bg-red-300/30 text-red-200'
          }`}>
            {status === 'active' ? '구독 중' : status === 'cancelled' ? '취소됨' : '결제 오류'}
          </span>
        </div>

        {plan !== 'free' && dateLabel && (
          <p className="mt-3 text-xs text-white/70">
            다음 결제일: <span className="text-white font-medium">{dateLabel}</span>
          </p>
        )}

        {plan === 'free' && (
          <p className="mt-3 text-xs text-white/70">무료 플랜 · 세특 월 3회</p>
        )}
      </div>

      {/* 업그레이드 유도 (무료/스탠다드만) */}
      {plan !== 'premium' && (
        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-sm font-bold text-purple-900">
            {plan === 'free' ? '준비생으로 업그레이드' : '입시생으로 업그레이드'}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-purple-500">
            {plan === 'free' && (
              <>
                <li>✓ 세특 월 20회 + 탐구보고서 월 10회</li>
                <li>✓ 세특 이력 무제한 보관</li>
              </>
            )}
            {plan === 'standard' && (
              <>
                <li>✓ 세특 · 탐구 무제한</li>
                <li>✓ SKY 합격생 세특 분석</li>
                <li>✓ 선생님 공유 링크</li>
              </>
            )}
          </ul>
          <button
            onClick={() => router.push('/pricing')}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 py-2 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
          >
            업그레이드 →
          </button>
        </div>
      )}

      {/* 구독 취소 (의도적 prominence 최소화) */}
      {plan !== 'free' && status === 'active' && (
        <div className="text-center">
          <button
            onClick={() => setShowCancel(true)}
            className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            구독 취소
          </button>
        </div>
      )}

      {showCancel && (
        <CancelFlow onClose={() => setShowCancel(false)} plan={plan} />
      )}
    </div>
  );
}
