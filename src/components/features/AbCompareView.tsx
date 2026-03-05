'use client';

import { useState } from 'react';
import CopyButton from '@/components/ui/CopyButton';

interface AbVersion {
  report: string;
  setech: string;
}

interface AbCompareViewProps {
  versionA: AbVersion;
  versionB: AbVersion;
  onSelect: (version: 'A' | 'B', report: string, setech: string) => void;
}

export default function AbCompareView({ versionA, versionB, onSelect }: AbCompareViewProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'setech'>('report');
  const [mixReport, setMixReport] = useState<'A' | 'B'>('A');
  const [mixSetech, setMixSetech] = useState<'A' | 'B'>('A');
  const [isMixMode, setIsMixMode] = useState(false);

  const handleMixApply = () => {
    const report = mixReport === 'A' ? versionA.report : versionB.report;
    const setech = mixSetech === 'A' ? versionA.setech : versionB.setech;
    onSelect(mixReport, report, setech);
  };

  const tabClass = (active: boolean) =>
    `flex-1 py-2 text-xs font-medium transition-colors ${
      active ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-slate-700'
    }`;

  const VersionPanel = ({
    version,
    label,
    versionKey,
  }: {
    version: AbVersion;
    label: string;
    versionKey: 'A' | 'B';
  }) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          버전 {label}
        </span>
        <span className="text-xs text-slate-400">
          {activeTab === 'report' ? version.report.length : version.setech.length}자
        </span>
      </div>
      <div className="min-h-[180px] rounded-lg border border-slate-200 bg-white p-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
          {activeTab === 'report' ? version.report : version.setech}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSelect(versionKey, version.report, version.setech)}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          이 버전 사용
        </button>
        <CopyButton
          text={activeTab === 'report' ? version.report : version.setech}
          label={`버전 ${label}`}
        />
      </div>
    </div>
  );

  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">A/B 버전 비교</p>
        <button
          onClick={() => setIsMixMode(!isMixMode)}
          className="text-xs text-indigo-600 underline hover:text-indigo-700"
        >
          {isMixMode ? '일반 비교로' : '믹스앤매치 모드'}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="mb-4 flex border-b border-slate-200">
        <button onClick={() => setActiveTab('report')} className={tabClass(activeTab === 'report')}>
          탐구보고서
        </button>
        <button onClick={() => setActiveTab('setech')} className={tabClass(activeTab === 'setech')}>
          세특 500자
        </button>
      </div>

      {isMixMode ? (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">보고서 선택</p>
            <div className="flex gap-2">
              {(['A', 'B'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setMixReport(v)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    mixReport === v
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  버전 {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">세특 선택</p>
            <div className="flex gap-2">
              {(['A', 'B'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setMixSetech(v)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    mixSetech === v
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  버전 {v}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleMixApply}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            이 조합으로 사용하기 (보고서 {mixReport} + 세특 {mixSetech})
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <VersionPanel version={versionA} label="A" versionKey="A" />
          <VersionPanel version={versionB} label="B" versionKey="B" />
        </div>
      )}
    </div>
  );
}
