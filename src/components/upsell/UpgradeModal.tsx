'use client';

import { useEffect } from 'react';
import type { Plan } from '@/types/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: Plan;
  trigger?: 'limit_exceeded' | 'feature_locked';
  feature?: string;
}

const PLANS = [
  {
    plan: 'standard' as Plan,
    name: '준비생',
    price: '9,900원/월',
    features: ['세특 월 20회', '탐구보고서 월 10회', '8과목 전체', '세특 이력 보관'],
    color: 'from-blue-500 to-indigo-500',
  },
  {
    plan: 'premium' as Plan,
    name: '입시생',
    price: '19,900원/월',
    features: ['세특 · 탐구 무제한', 'SKY 합격생 세특 분석', '선생님 공유 링크', 'PDF 일괄 다운로드'],
    color: 'from-fuchsia-500 to-pink-500',
    recommended: true,
  },
];

export default function UpgradeModal({ isOpen, onClose, currentPlan, trigger, feature }: UpgradeModalProps) {
  // ESC 키 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const title = trigger === 'limit_exceeded'
    ? '이번 달 한도를 모두 사용했어요'
    : feature
    ? `${feature}는 유료 플랜 전용이에요`
    : '더 많이 사용하고 싶으세요?';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl">
        {/* 상단 핸들 (모바일) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
        >
          ✕
        </button>

        {/* 프리미엄 잠금 아이콘 */}
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </span>
          <h2 className="text-lg font-bold text-purple-900">{title}</h2>
        </div>
        <p className="mb-5 text-sm text-purple-400">업그레이드하면 더 많이 만들 수 있어요</p>

        <div className="space-y-3">
          {PLANS.filter(p => p.plan !== currentPlan || currentPlan === 'free').map(p => (
            <div
              key={p.plan}
              className={`relative rounded-2xl p-4 ${p.recommended ? `bg-gradient-to-r ${p.color} text-white` : 'border border-purple-100 bg-purple-50'}`}
            >
              {p.recommended && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900">
                  추천
                </span>
              )}
              <div className="mb-2 flex items-center justify-between">
                <span className={`font-bold ${p.recommended ? 'text-white' : 'text-purple-900'}`}>{p.name}</span>
                <span className={`text-sm font-semibold ${p.recommended ? 'text-white/90' : 'text-purple-600'}`}>{p.price}</span>
              </div>
              <ul className={`space-y-0.5 text-xs ${p.recommended ? 'text-white/80' : 'text-purple-500'}`}>
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-3 w-full rounded-xl py-2 text-sm font-bold transition-all active:scale-95 ${
                  p.recommended
                    ? 'bg-white text-fuchsia-600 hover:bg-white/90'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {p.name} 시작하기
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600"
        >
          다음 달까지 기다리기
        </button>
      </div>
    </div>
  );
}
