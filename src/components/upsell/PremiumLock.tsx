'use client';

import { useState, useRef, useEffect } from 'react';

interface PremiumLockProps {
  /** 잠긴 기능 이름 (팝오버 타이틀에 표시) */
  featureName?: string;
  /** 팝오버를 표시할 방향 (기본: top) */
  placement?: 'top' | 'bottom';
  /** 아이콘 크기 클래스 (기본: h-4 w-4) */
  sizeClass?: string;
  /** 클릭 시 업그레이드 모달 열기 콜백 */
  onUpgradeClick?: () => void;
}

export default function PremiumLock({
  featureName = '이 기능',
  placement = 'top',
  sizeClass = 'h-4 w-4',
  onUpgradeClick,
}: PremiumLockProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="프리미엄 전용 기능"
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 p-0.5 shadow-sm hover:brightness-110 transition-all active:scale-90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`${sizeClass} text-white`}
        >
          <path
            fillRule="evenodd"
            d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* 팝오버 */}
      {open && (
        <div
          className={`absolute z-50 w-52 rounded-xl border border-fuchsia-100 bg-white p-3 shadow-xl ${
            placement === 'top'
              ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
              : 'left-1/2 mt-2 top-full -translate-x-1/2'
          }`}
        >
          {/* 말풍선 꼬리 */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 border-8 border-transparent ${
              placement === 'top'
                ? 'top-full border-t-white'
                : 'bottom-full border-b-white'
            }`}
          />
          <p className="mb-1 text-xs font-bold text-slate-800">
            {featureName}은 유료 플랜 전용이에요
          </p>
          <p className="mb-2.5 text-[11px] text-slate-500">Pro 플랜에서 무제한으로 사용하세요</p>
          <button
            onClick={() => { setOpen(false); onUpgradeClick?.(); }}
            className="w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-pink-500 py-1.5 text-xs font-bold text-white hover:brightness-110 transition-all active:scale-95"
          >
            업그레이드 →
          </button>
        </div>
      )}
    </div>
  );
}
