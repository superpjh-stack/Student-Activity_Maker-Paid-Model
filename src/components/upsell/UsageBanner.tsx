'use client';

interface UsageBannerProps {
  used: number;
  limit: number;
  type: 'seteok' | 'report';
  onUpgrade: () => void;
}

export default function UsageBanner({ used, limit, type, onUpgrade }: UsageBannerProps) {
  const ratio = used / limit;
  if (ratio < 0.7) return null;

  const remaining = Math.max(0, limit - used);
  const label = type === 'seteok' ? '세특' : '탐구보고서';

  let barColor = 'bg-green-400';
  let message = '';

  if (ratio >= 1) {
    barColor = 'bg-red-400';
    message = `이번 달 ${label} 한도를 모두 사용했어요.`;
  } else if (ratio >= 0.9) {
    barColor = 'bg-red-400';
    message = `이번 달 ${label} ${remaining}회만 남았어요!`;
  } else {
    barColor = 'bg-yellow-400';
    message = `이번 달 ${label} ${remaining}회 남았어요.`;
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
      {/* 진행 바 */}
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-orange-100">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-orange-700">{message}</p>
        <button
          onClick={onUpgrade}
          className="ml-3 flex-shrink-0 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95"
        >
          업그레이드
        </button>
      </div>
    </div>
  );
}
