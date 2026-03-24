'use client';

import { useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import type { DiagnosisItem } from '@/lib/ai';

interface DiagnosisResponse {
  items: (DiagnosisItem & { score: number })[];
  totalScore: number;
  weakPoints: string[];
  message: string;
  locked: boolean;
  plan: string;
  used: number;
  limit: number;
}

const ITEM_NAMES: Record<string, string> = {
  authenticity: '진정성',
  major_alignment: '전공연계',
  logic_structure: '논리구조',
  depth: '심화깊이',
  language_variety: '언어다양성',
  ai_risk: 'AI탈피',
};

function ScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-500';
}

function ScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-yellow-400';
  return 'bg-red-400';
}

export default function DiagnosisReport() {
  const [text, setText] = useState('');
  const [type, setType] = useState<'seteok' | 'report'>('seteok');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResponse | null>(null);
  const [error, setError] = useState('');

  const handleDiagnose = async () => {
    if (text.trim().length < 50) {
      setError('최소 50자 이상 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type }),
      });
      const data = await res.json() as DiagnosisResponse & { error?: string };
      if (!res.ok) {
        if (data.error === 'LIMIT_EXCEEDED') {
          setError(`이번 달 진단 횟수(${data.limit}회)를 모두 사용했어요. 다음 달에 다시 시도하거나 플랜을 업그레이드하세요.`);
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

  // 레이더 차트용 데이터 (completeness 제외)
  const radarData = result?.items
    .filter((it) => it.id !== 'completeness')
    .map((it) => ({
      subject: ITEM_NAMES[it.id] ?? it.name,
      score: it.score === -1 ? 0 : it.score,
    })) ?? [];

  return (
    <div className="space-y-5">
      {/* 입력 영역 */}
      {!result && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-bold text-purple-900 mb-2">진단할 내용 선택</p>
            <div className="flex gap-2">
              {(['seteok', 'report'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                    type === t
                      ? 'bg-fuchsia-500 text-white'
                      : 'border border-purple-100 text-purple-500'
                  }`}
                >
                  {t === 'seteok' ? '세특' : '탐구보고서'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-purple-900 mb-2">텍스트 붙여넣기</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${type === 'seteok' ? '세특' : '탐구보고서'} 내용을 붙여넣어 주세요 (최소 50자)`}
              rows={8}
              className="w-full rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-sm text-purple-900 placeholder:text-purple-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-300 resize-none"
            />
            <p className="mt-1 text-right text-xs text-purple-400">{text.length}자</p>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>
          )}

          <button
            onClick={handleDiagnose}
            disabled={loading || text.trim().length < 50}
            className="w-full rounded-2xl btn-gradient py-3.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                AI가 입시관 관점으로 검토 중...
              </span>
            ) : (
              '진단 시작하기'
            )}
          </button>
        </div>
      )}

      {/* 결과 영역 */}
      {result && (
        <div className="space-y-4">
          {/* 종합 점수 */}
          <div className="glass-card rounded-2xl p-5 text-center">
            <p className="text-xs text-purple-400 mb-1">생기부 건강 점수</p>
            <div className={`text-6xl font-black mb-2 ${ScoreColor(result.totalScore)}`}>
              {result.totalScore}
              <span className="text-2xl text-purple-300">/100</span>
            </div>
            <p className="text-sm text-purple-700 leading-relaxed max-w-xs mx-auto">
              {result.message}
            </p>
            <div className="mt-2 text-xs text-purple-300">
              이번 달 {result.used}/{result.limit === 9999 ? '무제한' : result.limit}회 사용
            </div>
          </div>

          {/* 레이더 차트 */}
          <div className="glass-card rounded-2xl p-5">
            <p className="text-sm font-bold text-purple-900 mb-3">항목별 분석</p>
            {result.locked ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData.map(d => ({ ...d, score: 50 }))}>
                    <PolarGrid stroke="#e9d5ff" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#a78bfa' }} />
                    <Radar dataKey="score" stroke="#d8b4fe" fill="#d8b4fe" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm bg-white/60">
                  <p className="text-sm font-bold text-purple-700">준비생 플랜에서 확인하세요</p>
                  <a
                    href="/pricing"
                    className="mt-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-1.5 text-xs font-bold text-white"
                  >
                    플랜 업그레이드 →
                  </a>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e9d5ff" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#7c3aed' }} />
                  <Radar
                    dataKey="score"
                    stroke="#d946ef"
                    fill="#d946ef"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 항목별 상세 */}
          {!result.locked && (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <p className="text-sm font-bold text-purple-900">세부 피드백</p>
              {result.items
                .filter((it) => it.id !== 'completeness')
                .map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-purple-700">{item.name}</span>
                      <span className={`text-xs font-bold ${ScoreColor(item.score)}`}>
                        {item.score}점
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-purple-100">
                      <div
                        className={`h-1.5 rounded-full transition-all ${ScoreBgColor(item.score)}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    {item.feedback && (
                      <p className="mt-1 text-[11px] text-purple-400">{item.feedback}</p>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* 취약점 즉시 보완 */}
          {result.weakPoints.length > 0 && (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <p className="text-sm font-bold text-purple-900">취약 항목 즉시 보완</p>
              {result.weakPoints.map((wp) => (
                <div key={wp} className="flex items-center justify-between rounded-xl bg-red-50 p-3">
                  <div>
                    <p className="text-xs font-bold text-red-700">
                      {result.items.find((it) => it.id === wp)?.name ?? wp} 개선 필요
                    </p>
                    <p className="text-[11px] text-red-500 mt-0.5">
                      {result.items.find((it) => it.id === wp)?.feedback}
                    </p>
                  </div>
                  <a
                    href="/generate"
                    className="ml-3 flex-shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors"
                  >
                    보완하기
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* 다시 진단 */}
          <button
            onClick={() => { setResult(null); setText(''); }}
            className="w-full rounded-2xl border border-purple-100 py-3 text-sm font-medium text-purple-500 hover:border-fuchsia-300 transition-colors"
          >
            다시 진단하기
          </button>
        </div>
      )}
    </div>
  );
}
