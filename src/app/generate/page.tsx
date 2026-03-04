'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSubjectById } from '@/lib/subjects';
import { saveHistoryItem } from '@/lib/history';
import { exportToDocx } from '@/lib/docx-export';
import ResultDisplay from '@/components/features/ResultDisplay';
import type { LengthOption, ToneOption, HistoryItem } from '@/types';

const LENGTH_OPTIONS: { value: LengthOption; label: string; desc: string }[] = [
  { value: 'short', label: '단', desc: '500자 내외 · 요약형' },
  { value: 'medium', label: '중', desc: '1000자 내외 · 일반형' },
  { value: 'long', label: '장', desc: '2000자 내외 · 상세형' },
];

const TONE_OPTIONS: { value: ToneOption; label: string; desc: string }[] = [
  { value: 'academic', label: '학술적', desc: '논문체 · 전문용어' },
  { value: 'friendly', label: '친근한', desc: '구어체 · 읽기쉬움' },
  { value: 'neutral', label: '중립적', desc: '일반체 · 균형있음' },
];

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subjectId = searchParams.get('subject') || '';
  const topic = searchParams.get('topic') || '';
  const subject = getSubjectById(subjectId);

  const [length, setLength] = useState<LengthOption>('medium');
  const [tone, setTone] = useState<ToneOption>('neutral');
  const [report, setReport] = useState<string | null>(null);
  const [setech, setSetech] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [setechLoading, setSetechLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedItem, setSavedItem] = useState<HistoryItem | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (!subject || !topic) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">잘못된 접근입니다.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-indigo-600 hover:underline"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const persistHistory = (newReport: string | null, newSetech: string | null) => {
    const item = saveHistoryItem({
      subjectId: subject.id,
      subjectName: subject.name,
      subjectEmoji: subject.emoji,
      topic,
      length,
      tone,
      report: newReport,
      setech: newSetech,
    });
    setSavedItem(item);
    return item;
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.name, topic, length, tone }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '생성 중 오류가 발생했습니다.');
      }
      const data = await res.json();
      setReport(data.report);
      persistHistory(data.report, setech);
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 중 오류가 발생했습니다.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleGenerateSetech = async () => {
    setSetechLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-setech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.name,
          topic,
          reportContent: report || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '생성 중 오류가 발생했습니다.');
      }
      const data = await res.json();
      setSetech(data.setech);
      persistHistory(report, data.setech);
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 중 오류가 발생했습니다.');
    } finally {
      setSetechLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!savedItem) return;
    setDownloading(true);
    try {
      await exportToDocx({ ...savedItem, report, setech });
    } finally {
      setDownloading(false);
    }
  };

  const hasResult = report || setech;

  return (
    <div className="py-8">
      {/* Steps */}
      <div className="mb-8 flex items-center justify-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">✓</span>
          <span>과목 선택</span>
        </div>
        <div className="h-px w-6 bg-indigo-400" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">✓</span>
          <span>주제 선택</span>
        </div>
        <div className="h-px w-6 bg-indigo-400" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">3</span>
          <span>AI 생성</span>
        </div>
      </div>

      {/* Selected info */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">선택 요약</p>
        <p className="mt-1 font-medium text-slate-800">
          {subject.emoji} {subject.name}
        </p>
        <p className="mt-1 text-sm text-slate-600">{topic}</p>
      </div>

      {/* Length options */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-slate-700">탐구보고서 길이</p>
        <div className="grid grid-cols-3 gap-3">
          {LENGTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLength(opt.value)}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                length === opt.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-base font-semibold text-slate-800">{opt.label}</p>
              <p className="mt-1 text-xs text-slate-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tone options */}
      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-slate-700">문체 / 톤</p>
        <div className="grid grid-cols-3 gap-3">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTone(opt.value)}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                tone === opt.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-base font-semibold text-slate-800">{opt.label}</p>
              <p className="mt-1 text-xs text-slate-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Generate buttons */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleGenerateReport}
          disabled={reportLoading || setechLoading}
          className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {reportLoading ? '생성 중...' : '탐구보고서 생성'}
        </button>
        <button
          onClick={handleGenerateSetech}
          disabled={reportLoading || setechLoading}
          className="flex-1 rounded-lg border-2 border-indigo-600 px-6 py-3 text-base font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:border-indigo-300 disabled:text-indigo-300"
        >
          {setechLoading ? '생성 중...' : '세특 500자 생성'}
        </button>
      </div>

      {/* Download button */}
      {hasResult && (
        <div className="mb-8 flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-sm text-indigo-700">
            ✅ 이력에 자동 저장되었습니다.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {downloading ? '⏳ 변환 중...' : '⬇️ .docx 다운로드'}
            </button>
            <button
              onClick={() => router.push('/history')}
              className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-100"
            >
              이력 보기
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <ResultDisplay
        report={report}
        setech={setech}
        reportLoading={reportLoading}
        setechLoading={setechLoading}
      />

      {/* Home link */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/')}
          className="text-sm text-slate-500 hover:text-indigo-600 hover:underline"
        >
          처음으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
