'use client';

import { useState, useEffect } from 'react';
import CopyButton from '@/components/ui/CopyButton';
import StreamingTextDisplay from '@/components/features/StreamingTextDisplay';
import type { StreamingState } from '@/types';

const AB_STEPS = [
  '버전 A 아이디어 구상 중...',
  '버전 A 작성 중...',
  '버전 B 다른 관점 탐색 중...',
  '버전 B 작성 중...',
  '두 버전 세특 생성 중...',
  '마무리 중...',
];

function AbLoadingButton() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 12000;
    const interval = 80;
    const increment = (92 / duration) * interval;
    const timer = setInterval(() => setProgress((p) => Math.min(p + increment, 92)), interval);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setStepIndex((i) => Math.min(i + 1, AB_STEPS.length - 1)), 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-pink-50">
      <div className="h-1 bg-violet-100">
        <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        <p className="flex-1 text-sm font-medium text-violet-700">{AB_STEPS[stepIndex]}</p>
        <span className="text-xs font-bold text-violet-500">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

function AbRequestButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-violet-300 px-4 py-1.5 text-sm font-semibold text-violet-600 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
    >
      🔀 다른 버전 보기
    </button>
  );
}

interface ResultDisplayProps {
  report: string | null;
  setech: string | null;
  reportLoading: boolean;
  setechLoading: boolean;
  reportStreamState?: StreamingState;
  setechStreamState?: StreamingState;
  onRequestAb?: () => void;
  abLoading?: boolean;
}

export default function ResultDisplay({
  report,
  setech,
  reportLoading,
  setechLoading,
  reportStreamState,
  setechStreamState,
  onRequestAb,
  abLoading,
}: ResultDisplayProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'setech'>('report');

  const isStreaming = reportStreamState === 'streaming' || setechStreamState === 'streaming';
  const useStreaming = reportStreamState !== undefined;

  return (
    <div className="w-full">
      {/* ── Tabs ── */}
      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
        {[
          { id: 'report', label: '📄 탐구보고서' },
          { id: 'setech', label: '📝 세특 500자' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'report' | 'setech')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-violet-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="mt-4">
        {activeTab === 'report' && (
          <div>
            {reportLoading && !useStreaming ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                <p className="mt-3 text-sm font-medium text-slate-500">탐구보고서 생성 중...</p>
              </div>
            ) : useStreaming ? (
              <div>
                <StreamingTextDisplay
                  text={report ?? ''}
                  state={reportStreamState!}
                  label="탐구보고서"
                />
                {reportStreamState === 'done' && report && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <CopyButton text={report} label="탐구보고서" />
                    {onRequestAb && !abLoading && (
                      <AbRequestButton onClick={onRequestAb} disabled={isStreaming} />
                    )}
                    {abLoading && <AbLoadingButton />}
                  </div>
                )}
              </div>
            ) : report ? (
              <div>
                <div className="glass-card rounded-2xl p-5">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{report}</div>
                  <p className="mt-4 text-right text-xs font-medium text-slate-400">총 {report.length}자</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <CopyButton text={report} label="탐구보고서" />
                  {onRequestAb && !abLoading && (
                    <AbRequestButton onClick={onRequestAb} disabled={false} />
                  )}
                  {abLoading && <AbLoadingButton />}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <span className="text-4xl opacity-30">📄</span>
                <p className="mt-3 text-sm text-slate-400">위 버튼을 눌러 탐구보고서를 생성하세요</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'setech' && (
          <div>
            {setechLoading && !useStreaming ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                <p className="mt-3 text-sm font-medium text-slate-500">세특 500자 생성 중...</p>
              </div>
            ) : useStreaming ? (
              <div>
                <StreamingTextDisplay
                  text={setech ?? ''}
                  state={setechStreamState!}
                  label="세특 500자"
                />
                {setechStreamState === 'done' && setech && (
                  <div className="mt-3">
                    <CopyButton text={setech} label="세특 500자" />
                  </div>
                )}
              </div>
            ) : setech ? (
              <div>
                <div className="glass-card rounded-2xl p-5">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{setech}</div>
                  <p className="mt-4 text-right text-xs font-medium text-slate-400">총 {setech.length}자</p>
                </div>
                <div className="mt-3">
                  <CopyButton text={setech} label="세특 500자" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <span className="text-4xl opacity-30">📝</span>
                <p className="mt-3 text-sm text-slate-400">탐구보고서 생성 후 세특이 자동으로 만들어집니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
