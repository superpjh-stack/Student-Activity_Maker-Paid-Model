'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'warning' | 'reason' | 'offer' | 'done';

const CANCEL_REASONS = [
  '세특을 다 완성했어요',
  '가격이 부담돼요',
  '기능이 기대에 못 미쳐요',
  '자주 사용하지 않게 됐어요',
  '다른 서비스를 이용하려고요',
  '잠깐 쉬고 싶어요',
];

const OFFERS: Record<string, { title: string; desc: string; cta: string }> = {
  '가격이 부담돼요': {
    title: '1개월 50% 할인 쿠폰을 드릴게요',
    desc: '지금 취소하지 않으시면 다음 달 결제를 50% 할인해 드립니다.',
    cta: '할인 받고 계속하기',
  },
  '자주 사용하지 않게 됐어요': {
    title: '구독을 일시 중지할 수 있어요',
    desc: '1~3개월 일시 중지 후 수능 직전에 다시 시작하세요. 할인 그대로 유지됩니다.',
    cta: '일시 중지하기',
  },
  '잠깐 쉬고 싶어요': {
    title: '구독을 일시 중지할 수 있어요',
    desc: '방학 동안 일시 중지 후 개학 전에 자동 재시작 옵션을 이용해보세요.',
    cta: '일시 중지하기',
  },
};

const DEFAULT_OFFER = {
  title: '취소 전에 한 번만 더 생각해 보세요',
  desc: '지금까지 쌓아온 세특 이력과 포트폴리오가 사라질 수 있어요.',
  cta: '계속 이용하기',
};

interface CancelFlowProps {
  onClose: () => void;
  plan: string;
}

export default function CancelFlow({ onClose, plan }: CancelFlowProps) {
  const [step, setStep] = useState<Step>('warning');
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const offer = selectedReason ? (OFFERS[selectedReason] ?? DEFAULT_OFFER) : DEFAULT_OFFER;

  const handleCancel = async () => {
    setLoading(true);
    await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: selectedReason, immediately: false }),
    });
    setLoading(false);
    setStep('done');
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

        {/* Step 1: 경고 */}
        {step === 'warning' && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-purple-900">정말 취소하실 건가요?</h2>
            <div className="mt-3 space-y-2 text-sm text-purple-500">
              <p>취소하면 다음과 같은 혜택이 사라져요:</p>
              <ul className="ml-4 list-disc space-y-1 text-xs text-purple-400">
                {plan === 'premium' ? (
                  <>
                    <li>세특 · 탐구 무제한 생성</li>
                    <li>SKY 합격생 세특 분석</li>
                    <li>선생님 공유 링크</li>
                  </>
                ) : (
                  <>
                    <li>세특 월 20회 생성</li>
                    <li>탐구보고서 월 10회 생성</li>
                    <li>세특 이력 무제한 보관</li>
                  </>
                )}
              </ul>
              <p className="text-xs text-purple-300 pt-1">현재 기간이 끝나는 날까지는 계속 이용할 수 있어요.</p>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-xl bg-fuchsia-500 py-2.5 text-sm font-bold text-white hover:bg-fuchsia-600 active:scale-95">
                계속 이용하기
              </button>
              <button onClick={() => setStep('reason')} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-400 hover:bg-gray-50">
                취소 진행
              </button>
            </div>
          </>
        )}

        {/* Step 2: 이유 선택 */}
        {step === 'reason' && (
          <>
            <h2 className="text-lg font-bold text-purple-900">취소 이유가 무엇인가요?</h2>
            <p className="mt-1 mb-4 text-xs text-purple-400">서비스 개선에 활용할게요</p>
            <div className="space-y-2">
              {CANCEL_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedReason(r)}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition-all ${
                    selectedReason === r
                      ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 border'
                      : 'border border-gray-100 text-gray-600 hover:border-purple-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('offer')}
              disabled={!selectedReason}
              className="mt-4 w-full rounded-xl bg-purple-600 py-2.5 text-sm font-bold text-white disabled:opacity-40 hover:bg-purple-700 active:scale-95"
            >
              다음
            </button>
          </>
        )}

        {/* Step 3: 맞춤 오퍼 */}
        {step === 'offer' && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-100 text-2xl">
              🎁
            </div>
            <h2 className="text-lg font-bold text-purple-900">{offer.title}</h2>
            <p className="mt-2 mb-5 text-sm text-purple-400">{offer.desc}</p>
            <button onClick={onClose} className="w-full rounded-xl bg-fuchsia-500 py-2.5 text-sm font-bold text-white hover:bg-fuchsia-600 active:scale-95 mb-2">
              {offer.cta}
            </button>
            <button onClick={handleCancel} disabled={loading} className="w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-400 hover:bg-gray-50 disabled:opacity-60">
              {loading ? '처리 중...' : '그래도 취소할게요'}
            </button>
          </>
        )}

        {/* Done */}
        {step === 'done' && (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
              👋
            </div>
            <h2 className="text-lg font-bold text-purple-900">취소 신청이 완료됐어요</h2>
            <p className="mt-2 mb-5 text-sm text-purple-400">
              현재 구독 기간이 끝나는 날까지는 계속 이용할 수 있어요. 언제든지 다시 구독할 수 있습니다.
            </p>
            <button onClick={onClose} className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-bold text-white hover:bg-purple-700">
              확인
            </button>
          </>
        )}
      </div>
    </div>
  );
}
