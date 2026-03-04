'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getHistoryItem, deleteHistoryItem } from '@/lib/history';
import { exportToDocx } from '@/lib/docx-export';
import CopyButton from '@/components/ui/CopyButton';
import type { HistoryItem } from '@/types';

const TONE_LABEL: Record<string, string> = {
  academic: '학술적',
  friendly: '친근한',
  neutral: '중립적',
};

const LENGTH_LABEL: Record<string, string> = {
  short: '단 (500자)',
  medium: '중 (1000자)',
  long: '장 (2000자)',
};

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'setech'>('report');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const found = getHistoryItem(id);
    if (!found) {
      router.push('/history');
      return;
    }
    setItem(found);
    // 있는 탭으로 기본값 설정
    if (!found.report && found.setech) setActiveTab('setech');
  }, [id, router]);

  if (!item) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportToDocx(item);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () => {
    if (!confirm('이 이력을 삭제할까요?')) return;
    deleteHistoryItem(item.id);
    router.push('/history');
  };

  return (
    <div className="py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/history')}
            className="mb-2 text-sm text-slate-500 hover:text-slate-700"
          >
            ← 이력 목록
          </button>
          <h1 className="text-xl font-bold text-slate-900">
            {item.subjectEmoji} {item.subjectName}
          </h1>
          <p className="mt-1 text-slate-600">{item.topic}</p>
          <p className="mt-1 text-xs text-slate-400">
            {new Date(item.createdAt).toLocaleString('ko-KR')}
            {item.report && ` · ${LENGTH_LABEL[item.length]} · ${TONE_LABEL[item.tone]}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {downloading ? '⏳ 변환 중...' : '⬇️ .docx 다운로드'}
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-slate-200">
        {item.report && (
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
        )}
        {item.setech && (
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
        )}
      </div>

      {/* 탭 내용 */}
      <div className="mt-4">
        {activeTab === 'report' && item.report && (
          <div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                {item.report}
              </div>
              <p className="mt-3 text-right text-xs text-slate-400">총 {item.report.length}자</p>
            </div>
            <div className="mt-3">
              <CopyButton text={item.report} label="탐구보고서" />
            </div>
          </div>
        )}

        {activeTab === 'setech' && item.setech && (
          <div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                {item.setech}
              </div>
              <p className="mt-3 text-right text-xs text-slate-400">총 {item.setech.length}자</p>
            </div>
            <div className="mt-3">
              <CopyButton text={item.setech} label="세특 500자" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
