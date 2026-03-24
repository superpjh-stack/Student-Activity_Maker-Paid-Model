'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Plan } from '@/types/subscription';

const PLANS = [
  {
    plan: 'free' as Plan,
    name: '탐구생',
    price: { monthly: 0, annual: 0 },
    features: ['세특 월 3회', '탐구보고서 월 1회', '3과목', '이력 7일 보관'],
    color: 'border-gray-200 bg-white',
    btnClass: 'bg-gray-100 text-gray-500 cursor-default',
    btnText: '현재 플랜',
    isFree: true,
  },
  {
    plan: 'standard' as Plan,
    name: '준비생',
    price: { monthly: 9900, annual: 79000 },
    features: ['세특 월 20회', '탐구보고서 월 10회', '8과목 전체', '이력 무제한 보관', '세특 복사/공유'],
    color: 'border-blue-200 bg-blue-50/40',
    btnClass: 'bg-blue-600 text-white hover:bg-blue-700',
    btnText: '시작하기',
    isFree: false,
  },
  {
    plan: 'premium' as Plan,
    name: '입시생',
    price: { monthly: 19900, annual: 149000 },
    features: ['세특 · 탐구 무제한', 'SKY 합격생 세특 분석', '선생님 공유 링크', 'PDF 일괄 다운로드', '맞춤 피드백'],
    color: 'border-fuchsia-200 bg-gradient-to-b from-fuchsia-50 to-pink-50',
    btnClass: 'btn-gradient text-white',
    btnText: '시작하기',
    isFree: false,
    recommended: true,
  },
];

interface PricingCardsProps {
  currentPlan: Plan;
}

export default function PricingCards({ currentPlan }: PricingCardsProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const router = useRouter();

  const handleSubscribe = (plan: Plan) => {
    if (plan === currentPlan) return;
    if (plan === 'free') {
      router.push('/dashboard');
      return;
    }
    // Navigate to payment page with plan and period params
    router.push(`/payment?plan=${plan}&period=${billing}`);
  };

  const annualSave = (plan: typeof PLANS[1]) => {
    const annualMonthly = Math.round(plan.price.annual / 12);
    const save = plan.price.monthly - annualMonthly;
    return save > 0 ? save : 0;
  };

  return (
    <div className="space-y-6">
      {/* 월간/연간 토글 */}
      <div className="flex justify-center">
        <div className="flex rounded-full border border-purple-100 bg-purple-50 p-1">
          {(['monthly', 'annual'] as const).map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                billing === b ? 'bg-fuchsia-500 text-white shadow-sm' : 'text-purple-500'
              }`}
            >
              {b === 'monthly' ? '월간' : '연간'}
              {b === 'annual' && (
                <span className="ml-1.5 rounded-full bg-yellow-400 px-1.5 py-0.5 text-xs font-bold text-yellow-900">
                  최대 33%↓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 플랜 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map(p => {
          const isCurrent = p.plan === currentPlan;
          const price = p.isFree ? 0 : p.price[billing];
          const save = !p.isFree ? annualSave(p as typeof PLANS[1]) : 0;

          return (
            <div
              key={p.plan}
              className={`relative rounded-2xl border p-5 ${p.color} ${p.recommended ? 'ring-2 ring-fuchsia-400' : ''}`}
            >
              {p.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fuchsia-500 px-3 py-0.5 text-xs font-bold text-white">
                  추천
                </span>
              )}

              <p className="font-bold text-purple-900">{p.name}</p>

              <div className="mt-2 mb-1">
                <span className="text-2xl font-black text-purple-900">
                  {price === 0 ? '무료' : `${price.toLocaleString()}원`}
                </span>
                {price > 0 && (
                  <span className="text-xs text-purple-400">/{billing === 'monthly' ? '월' : '년'}</span>
                )}
              </div>

              {billing === 'annual' && save > 0 && (
                <p className="mb-3 text-xs text-fuchsia-500 font-medium">
                  월 {save.toLocaleString()}원 절약
                </p>
              )}

              <ul className="mb-4 space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-purple-600">
                    <span className="mt-0.5 text-fuchsia-400 flex-shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(p.plan)}
                disabled={isCurrent}
                className={`w-full rounded-xl py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                  isCurrent ? 'bg-gray-100 text-gray-500 cursor-default' : p.btnClass
                }`}
              >
                {isCurrent ? '현재 플랜' : p.isFree ? '무료로 시작' : p.btnText}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-purple-300">
        7일 이내 환불 보장 · 언제든지 취소 가능
      </p>
    </div>
  );
}
