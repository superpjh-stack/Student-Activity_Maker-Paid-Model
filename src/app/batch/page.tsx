'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BatchSubjectSelector from '@/components/features/BatchSubjectSelector';
import SourceList from '@/components/features/SourceList';
import UpgradeModal from '@/components/upsell/UpgradeModal';
import type { LengthOption, ToneOption, TeacherStyle, SourceItem } from '@/types';
import type { BatchItem } from '@/components/features/BatchSubjectSelector';

interface BatchResult {
  subjectId: string;
  subjectName: string;
  subjectEmoji: string;
  topic: string;
  report: string;
  setech: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
    >
      {copied ? '복사 완료!' : '복사'}
    </button>
  );
}

export default function BatchPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [items, setItems] = useState<BatchItem[]>([]);
  const [length, setLength] = useState<LengthOption>('medium');
  const [tone, setTone] = useState<ToneOption>('neutral');
  const [teacherStyle, setTeacherStyle] = useState<TeacherStyle | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [sourcesMap, setSourcesMap] = useState<Record<number, SourceItem[]>>({});
  const [sourcesLoadingSet, setSourcesLoadingSet] = useState<Set<number>>(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const canGenerate = items.length > 0 && items.every((item) => item.topic.trim().length > 0);

  const handleGenerate = async () => {
    // 로그인 상태면 사용량 체크 (배치 1회 = seteok 1회로 처리)
    if (session?.user) {
      const checkRes = await fetch('/api/usage/check?type=seteok');
      if (checkRes.ok) {
        const checkData = await checkRes.json() as { allowed: boolean; remaining: number | null };
        // 남은 횟수가 items.length보다 적으면 차단
        if (!checkData.allowed || (checkData.remaining !== null && checkData.remaining < items.length)) {
          setShowUpgradeModal(true);
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const payload = {
        items: items.map((item) => ({
          subject: item.subjectName,
          subjectId: item.subjectId,
          subjectName: item.subjectName,
          subjectEmoji: item.subjectEmoji,
          topic: item.topic,
        })),
        length,
        tone,
        teacherStyle,
      };
      const res = await fetch('/api/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '생성 실패');
      }
      const data = await res.json();
      setResults(data.results);
      setActiveTab(0);
      setSourcesMap({});

      // 로그인 상태면 사용량 증가 (배치 과목 수만큼)
      if (session?.user) {
        await Promise.all(
          data.results.map(() =>
            fetch('/api/usage/increment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'seteok' }),
            })
          )
        );
        // DB 이력 저장
        await Promise.all(
          (data.results as BatchResult[]).flatMap((r) => [
            fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subjectId: r.subjectId, subjectName: r.subjectName, type: 'report', topic: r.topic, content: r.report, charCount: r.report.length }),
            }),
            fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subjectId: r.subjectId, subjectName: r.subjectName, type: 'seteok', topic: r.topic, content: r.setech, charCount: r.setech.length }),
            }),
          ])
        );
      }

      // 각 결과에 대해 참고문헌 병렬 생성
      data.results.forEach((r: BatchResult, i: number) => {
        setSourcesLoadingSet((prev) => new Set(prev).add(i));
        fetch('/api/generate-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: r.subjectName, topic: r.topic }),
        })
          .then((res) => res.ok ? res.json() : { sources: [] })
          .then((data: { sources: SourceItem[] }) => {
            setSourcesMap((prev) => ({ ...prev, [i]: data.sources ?? [] }));
          })
          .catch(() => { /* 출처 실패 무시 */ })
          .finally(() => {
            setSourcesLoadingSet((prev) => { const s = new Set(prev); s.delete(i); return s; });
          });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    const allText = results
      .map(
        (r) =>
          `=== ${r.subjectEmoji} ${r.subjectName} — ${r.topic} ===\n\n[탐구보고서]\n${r.report}\n\n[세특 500자]\n${r.setech}`
      )
      .join('\n\n' + '─'.repeat(50) + '\n\n');
    await navigator.clipboard.writeText(allText);
  };

  return (
    <div className="py-6 pb-16">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => router.push('/')}
          className="mb-4 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-all active:scale-95"
        >
          ← 홈으로
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">멀티 과목 배치 생성</h1>
        <p className="mt-1 text-sm text-slate-500">
          여러 과목을 동시에 선택하고 세특·보고서를 한 번에 생성합니다 (최대 4개)
        </p>
      </div>

      {/* No results yet: show selector */}
      {results.length === 0 && (
        <>
          <BatchSubjectSelector
            items={items}
            onChange={setItems}
            length={length}
            tone={tone}
            teacherStyle={teacherStyle}
            onLengthChange={setLength}
            onToneChange={setTone}
            onTeacherStyleChange={setTeacherStyle}
          />

          {items.length === 0 && (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
              <span className="text-3xl">📦</span>
              <p className="mt-3 text-slate-400">과목을 추가해서 배치 생성을 시작하세요</p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className={`mt-6 w-full rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-95 ${
              canGenerate && !loading
                ? 'btn-gradient'
                : 'cursor-not-allowed bg-slate-200 text-slate-400'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                생성 중... ({items.length}개 병렬 처리)
              </span>
            ) : (
              `✨ AI 배치 생성 시작 (${items.length}개 과목)`
            )}
          </button>

          {loading && (
            <div className="mt-4 overflow-hidden rounded-full bg-slate-100">
              <div className="h-1.5 animate-pulse rounded-full bg-gradient-to-r from-violet-400 to-pink-400" style={{ width: '60%' }} />
            </div>
          )}
        </>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="limit_exceeded"
        currentPlan={(session?.user?.plan as 'free' | 'standard') ?? 'free'}
      />

      {/* Results */}
      {results.length > 0 && (
        <div>
          {/* Tab bar - 가로 스크롤 지원 */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                  activeTab === i
                    ? 'btn-gradient text-white shadow-md'
                    : 'glass-card border-transparent text-slate-600 hover:border-violet-200'
                }`}
              >
                {r.subjectEmoji} {r.subjectName}
              </button>
            ))}
          </div>

          {/* Active tab content */}
          {results[activeTab] && (
            <div className="space-y-4">
              <div className="glass-card rounded-2xl px-4 py-3">
                <p className="text-xs text-slate-400">선택 주제</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{results[activeTab].topic}</p>
              </div>

              {/* Report */}
              <div className="glass-card rounded-2xl p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">📄 탐구보고서</h3>
                  <CopyButton text={results[activeTab].report} />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {results[activeTab].report}
                </p>
              </div>

              {/* Setech */}
              <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">📝 세특 500자</h3>
                    <span className="text-xs text-violet-500 font-medium">
                      {results[activeTab].setech.length}자
                    </span>
                  </div>
                  <CopyButton text={results[activeTab].setech} />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {results[activeTab].setech}
                </p>
              </div>

              {/* Sources */}
              {(sourcesLoadingSet.has(activeTab) || sourcesMap[activeTab]?.length > 0) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <SourceList
                    sources={sourcesMap[activeTab] ?? []}
                    loading={sourcesLoadingSet.has(activeTab)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={handleCopyAll}
              className="rounded-2xl bg-slate-700 py-3 text-sm font-semibold text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              전체 결과 복사
            </button>
            <button
              onClick={() => { setResults([]); setItems([]); }}
              className="rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            >
              다시 생성하기
            </button>
            <button
              onClick={() => router.push('/')}
              className="rounded-2xl border border-violet-200 bg-violet-50 py-3 text-sm font-semibold text-violet-600 hover:bg-violet-100 active:scale-95 transition-all"
            >
              홈으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
