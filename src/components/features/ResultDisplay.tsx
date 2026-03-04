'use client';

import { useState } from 'react';
import CopyButton from '@/components/ui/CopyButton';

interface ResultDisplayProps {
  report: string | null;
  setech: string | null;
  reportLoading: boolean;
  setechLoading: boolean;
}

export default function ResultDisplay({
  report,
  setech,
  reportLoading,
  setechLoading,
}: ResultDisplayProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'setech'>('report');

  return (
    <div className="w-full">
      {/* Tab buttons */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'report'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          탐구보고서
        </button>
        <button
          onClick={() => setActiveTab('setech')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'setech'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          세특 500자
        </button>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'report' && (
          <div>
            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                <p className="mt-3 text-sm text-slate-500">탐구보고서 생성 중...</p>
              </div>
            ) : report ? (
              <div>
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                    {report}
                  </div>
                  <p className="mt-3 text-right text-xs text-slate-400">
                    총 {report.length}자
                  </p>
                </div>
                <div className="mt-3">
                  <CopyButton text={report} label="탐구보고서" />
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                아래 버튼을 눌러 탐구보고서를 생성하세요.
              </p>
            )}
          </div>
        )}

        {activeTab === 'setech' && (
          <div>
            {setechLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                <p className="mt-3 text-sm text-slate-500">세특 500자 생성 중...</p>
              </div>
            ) : setech ? (
              <div>
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                    {setech}
                  </div>
                  <p className="mt-3 text-right text-xs text-slate-400">
                    총 {setech.length}자
                  </p>
                </div>
                <div className="mt-3">
                  <CopyButton text={setech} label="세특 500자" />
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                아래 버튼을 눌러 세특 500자를 생성하세요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
