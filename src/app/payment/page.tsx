'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type { Plan } from '@/types/subscription';

const PLAN_INFO: Record<Exclude<Plan, 'free'>, {
  name: string;
  features: string[];
  gradient: string;
  icon: string;
}> = {
  standard: {
    name: '준비생',
    features: ['세특 월 20회', '탐구보고서 월 10회', '8과목 전체', '이력 무제한 보관', '세특 복사/공유'],
    gradient: 'from-blue-500 to-indigo-500',
    icon: '📘',
  },
  premium: {
    name: '입시생',
    features: ['세특 · 탐구 무제한', 'SKY 합격생 세특 분석', '선생님 공유 링크', 'PDF 일괄 다운로드', '맞춤 피드백'],
    gradient: 'from-fuchsia-500 to-pink-500',
    icon: '👑',
  },
};

const PRICING: Record<Exclude<Plan, 'free'>, { monthly: number; annual: number }> = {
  standard: { monthly: 9900, annual: 79000 },
  premium: { monthly: 19900, annual: 149000 },
};

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planParam = searchParams.get('plan') as Exclude<Plan, 'free'> | null;
  const periodParam = (searchParams.get('period') as 'monthly' | 'annual') ?? 'monthly';

  const [period, setPeriod] = useState<'monthly' | 'annual'>(periodParam);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Validate plan param
  const plan = planParam && (planParam === 'standard' || planParam === 'premium') ? planParam : null;

  useEffect(() => {
    if (!plan) {
      router.replace('/pricing');
    }
  }, [plan, router]);

  if (!plan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-purple-400">플랜 정보를 확인하고 있습니다...</p>
      </div>
    );
  }

  const info = PLAN_INFO[plan];
  const price = PRICING[plan][period];
  const monthlyPrice = period === 'annual' ? Math.round(PRICING[plan].annual / 12) : PRICING[plan].monthly;
  const annualSave = period === 'annual' ? (PRICING[plan].monthly * 12 - PRICING[plan].annual) : 0;

  const handlePayment = async () => {
    if (!agreed) return;
    setLoading(true);

    try {
      const toss = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const customerKey = `CUSTOMER_${Date.now()}`;

      const payment = toss.payment({ customerKey });
      await payment.requestBillingAuth({
        method: 'CARD',
        successUrl: `${window.location.origin}/payment/success?plan=${plan}&period=${period}&customerKey=${customerKey}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err) {
      console.error('결제 오류:', err);
      setLoading(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-black gradient-text">결제하기</h1>
        <p className="mt-1 text-sm text-purple-400">선택한 플랜을 확인하고 결제를 진행하세요</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Left: Plan summary */}
        <div className="space-y-4">
          {/* Selected plan card */}
          <div className={`rounded-2xl bg-gradient-to-br ${info.gradient} p-5 text-white`}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-2xl">
                {info.icon}
              </span>
              <div>
                <p className="text-xs text-white/70">선택한 플랜</p>
                <p className="text-xl font-black">{info.name}</p>
              </div>
            </div>

            <ul className="mt-4 space-y-1.5">
              {info.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                  <span className="mt-0.5 flex-shrink-0 text-white/60">&#10003;</span>{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Change plan link */}
          <button
            onClick={() => router.push('/pricing')}
            className="w-full text-center text-xs text-purple-400 hover:text-purple-600 transition-colors"
          >
            다른 플랜 선택하기
          </button>
        </div>

        {/* Right: Payment details */}
        <div className="space-y-4">
          {/* Billing period toggle */}
          <div className="glass-card rounded-2xl p-4">
            <p className="text-sm font-bold text-purple-900 mb-3">결제 주기</p>
            <div className="flex rounded-full border border-purple-100 bg-purple-50 p-1">
              {(['monthly', 'annual'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setPeriod(b)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    period === b ? 'bg-fuchsia-500 text-white shadow-sm' : 'text-purple-500'
                  }`}
                >
                  {b === 'monthly' ? '월간' : '연간'}
                  {b === 'annual' && (
                    <span className="ml-1 text-xs opacity-80">할인</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-purple-900">결제 금액</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-600">{info.name} ({period === 'monthly' ? '월간' : '연간'})</span>
                <span className="text-sm font-bold text-purple-900">{price.toLocaleString()}원</span>
              </div>

              {period === 'annual' && annualSave > 0 && (
                <div className="flex items-center justify-between text-fuchsia-500">
                  <span className="text-xs">연간 할인 혜택</span>
                  <span className="text-xs font-bold">-{annualSave.toLocaleString()}원 절약</span>
                </div>
              )}

              <hr className="border-purple-100" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-purple-900">총 결제 금액</span>
                <div className="text-right">
                  <p className="text-lg font-black text-purple-900">{price.toLocaleString()}원</p>
                  {period === 'annual' && (
                    <p className="text-xs text-purple-400">월 {monthlyPrice.toLocaleString()}원</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Agreement checkbox */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-purple-300 text-fuchsia-500 focus:ring-fuchsia-400"
            />
            <span className="text-xs text-purple-500 leading-relaxed">
              결제 진행에 동의합니다. {period === 'monthly' ? '매월' : '매년'} 자동 결제되며, 언제든지 취소할 수 있습니다.
              <br />
              <span className="text-purple-400">7일 이내 환불 보장</span>
            </span>
          </label>

          {/* Payment button */}
          <button
            onClick={handlePayment}
            disabled={!agreed || loading}
            className="w-full rounded-2xl btn-gradient py-3.5 text-base font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                결제 진행 중...
              </span>
            ) : (
              `${price.toLocaleString()}원 결제하기`
            )}
          </button>

          {/* Security notice */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-purple-300">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>토스페이먼츠 안전 결제</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-purple-400">로딩 중...</p>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
