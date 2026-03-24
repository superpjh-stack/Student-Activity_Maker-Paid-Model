'use client';

import { useState } from 'react';

interface TopicAngle {
  title: string;
  targetMajor: string;
  competitionLevel: 'low' | 'medium' | 'high';
  emoji: string;
}

interface RarityData {
  rarityScore: number;
  competitionLevel: 'low' | 'medium' | 'high';
  competitionLabel: string;
  angles: TopicAngle[];
  locked: boolean;
  totalAngles: number;
  plan: string;
}

interface TopicRarityBadgeProps {
  subjectName: string;
  topic: string;
  onSelectAngle?: (title: string) => void;
}

const LEVEL_STYLE = {
  low:    { badge: 'bg-green-100 text-green-700 border-green-200', dot: '🟢', bar: 'bg-green-400' },
  medium: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: '🟡', bar: 'bg-yellow-400' },
  high:   { badge: 'bg-red-100 text-red-700 border-red-200', dot: '🔴', bar: 'bg-red-400' },
};

export default function TopicRarityBadge({ subjectName, topic, onSelectAngle }: TopicRarityBadgeProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RarityData | null>(null);
  const [open, setOpen] = useState(false);

  const analyze = async () => {
    if (data) { setOpen(true); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/topic-rarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectName, topic }),
      });
      if (res.ok) {
        const json = await res.json() as RarityData;
        setData(json);
        setOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={analyze}
        disabled={loading}
        className="flex items-center gap-1 rounded-full border border-purple-100 bg-white px-2.5 py-1 text-xs text-purple-500 hover:border-fuchsia-300 hover:text-fuchsia-600 transition-all disabled:opacity-50"
      >
        {loading ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border border-purple-300 border-t-fuchsia-500" />
        ) : (
          <span>🔍</span>
        )}
        희소성 분석
      </button>

      {open && data && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-2xl border border-purple-100 bg-white p-4 shadow-xl">
          {/* 경쟁 밀도 */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-purple-900">주제 경쟁 밀도</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${LEVEL_STYLE[data.competitionLevel].badge}`}>
              {LEVEL_STYLE[data.competitionLevel].dot} {data.competitionLabel}
            </span>
          </div>

          {/* 밀도 바 */}
          <div className="h-1.5 rounded-full bg-purple-100 mb-4">
            <div
              className={`h-1.5 rounded-full ${LEVEL_STYLE[data.competitionLevel].bar}`}
              style={{ width: `${100 - data.rarityScore}%` }}
            />
          </div>

          {/* 차별화 각도 */}
          {data.angles.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-purple-700">차별화 각도 추천</p>
              {data.angles.map((angle, i) => (
                <button
                  key={i}
                  onClick={() => { onSelectAngle?.(angle.title); setOpen(false); }}
                  className="w-full text-left rounded-xl bg-purple-50 p-2.5 hover:bg-fuchsia-50 transition-colors"
                >
                  <p className="text-[11px] font-medium text-purple-900 leading-snug">
                    {angle.emoji} {angle.title}
                  </p>
                  <p className="text-[10px] text-purple-400 mt-0.5">{angle.targetMajor} 지망생에게 적합</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-purple-50 p-3 text-center">
              <p className="text-xs text-purple-600 font-medium">준비생 플랜에서 차별화 각도를 확인하세요</p>
              <a
                href="/pricing"
                className="mt-2 inline-block rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1 text-[10px] font-bold text-white"
              >
                업그레이드 →
              </a>
            </div>
          )}

          <button
            onClick={() => setOpen(false)}
            className="mt-3 w-full text-center text-[10px] text-purple-300 hover:text-purple-500"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
