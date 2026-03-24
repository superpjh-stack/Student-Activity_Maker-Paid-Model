'use client';

import { useState, useRef } from 'react';

interface DnaResult {
  keywords: string[];
  identity: string;
  description: string;
  recommendedMajors: string[];
  activities: { name: string }[];
  sharableText: string;
  locked: boolean;
  plan: string;
  used: number;
  limit: number;
}

export default function DnaCard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnaResult | null>(null);
  const [error, setError] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dna', { method: 'POST' });
      const data = await res.json() as DnaResult & { error?: string };
      if (!res.ok) {
        if (data.error === 'LIMIT_EXCEEDED') {
          setError(`이번 달 분석 횟수(${data.limit}회)를 모두 사용했어요.`);
        } else {
          setError(data.error ?? '오류가 발생했습니다.');
        }
        return;
      }
      setResult(data);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    const text = result.sharableText + '\n\n나도 분석받기 👉 ' + window.location.origin + '/my/dna';
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('클립보드에 복사되었습니다!'));
    }
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { quality: 0.95 });
      const link = document.createElement('a');
      link.download = 'my-dna-card.png';
      link.href = dataUrl;
      link.click();
    } catch {
      alert('이미지 저장에 실패했습니다.');
    }
  };

  if (!result) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center space-y-4">
        <div className="text-4xl">🧬</div>
        <div>
          <p className="font-bold text-purple-900">나만의 진로 키워드 DNA</p>
          <p className="text-sm text-purple-500 mt-1">
            내 탐구 기록을 AI가 분석해서 학문적 정체성을 발굴해드려요
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>
        )}

        <button
          onClick={generate}
          disabled={loading}
          className="w-full rounded-2xl btn-gradient py-3.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              탐구 기록 분석 중...
            </span>
          ) : (
            'DNA 분석 시작'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* DNA 카드 */}
      <div
        ref={cardRef}
        className="rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 p-6 text-white"
      >
        <p className="text-xs text-white/70 mb-4">나의 학문적 정체성</p>

        {/* 키워드 태그 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {result.keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm"
            >
              {kw}
            </span>
          ))}
          {result.locked && (
            <span className="rounded-full bg-white/10 border border-white/30 px-3 py-1 text-sm font-medium text-white/50">
              + 더 보기 🔒
            </span>
          )}
        </div>

        {/* 정체성 */}
        <p className="text-xl font-black leading-snug mb-3">
          "{result.identity}"
        </p>

        {/* 상세 설명 */}
        {result.description ? (
          <p className="text-sm text-white/80 leading-relaxed">{result.description}</p>
        ) : (
          <div className="relative">
            <p className="text-sm text-white/80 leading-relaxed blur-sm select-none">
              이 학생은 탐구 전반에 걸쳐 깊은 분석적 사고를 보여주며...
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <a
                href="/pricing"
                className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-fuchsia-600"
              >
                내 이야기 읽기 →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 추천 학과 & 활동 */}
      {!result.locked && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          {result.recommendedMajors.length > 0 && (
            <div>
              <p className="text-xs font-bold text-purple-700 mb-2">추천 학과</p>
              <div className="flex flex-wrap gap-2">
                {result.recommendedMajors.map((major) => (
                  <span key={major} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {major}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.activities.length > 0 && (
            <div>
              <p className="text-xs font-bold text-purple-700 mb-2">추천 활동</p>
              <ul className="space-y-1.5">
                {result.activities.map((act) => (
                  <li key={act.name} className="flex items-start gap-2 text-xs text-purple-600">
                    <span className="mt-0.5 text-fuchsia-400">→</span>
                    {act.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 공유 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 rounded-2xl border border-purple-100 py-3 text-sm font-medium text-purple-600 hover:border-fuchsia-300 transition-colors"
        >
          공유하기
        </button>
        <button
          onClick={handleSaveImage}
          className="flex-1 rounded-2xl border border-purple-100 py-3 text-sm font-medium text-purple-600 hover:border-fuchsia-300 transition-colors"
        >
          이미지 저장
        </button>
        <button
          onClick={() => setResult(null)}
          className="rounded-2xl border border-purple-100 px-4 py-3 text-sm font-medium text-purple-400 hover:border-fuchsia-300 transition-colors"
        >
          재분석
        </button>
      </div>

      <p className="text-center text-xs text-purple-300">
        이번 달 {result.used}/{result.limit === 9999 ? '무제한' : result.limit}회 분석 사용
      </p>
    </div>
  );
}
