'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHistory, deleteHistoryItem, clearHistory } from '@/lib/history';
import type { HistoryItem } from '@/types';

const TONE_LABEL: Record<string, string> = {
  academic: '학술적',
  friendly: '친근한',
  neutral: '중립적',
};

const LENGTH_LABEL: Record<string, string> = {
  short: '단',
  medium: '중',
  long: '장',
};

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm('이 이력을 삭제할까요?')) return;
    deleteHistoryItem(id);
    setItems(getHistory());
  };

  const handleClearAll = () => {
    if (!confirm('전체 이력을 삭제할까요?')) return;
    clearHistory();
    setItems([]);
  };

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🗂️ 생성 이력</h1>
          <p className="mt-1 text-sm text-slate-500">총 {items.length}개의 이력이 저장되어 있습니다.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
          >
            전체 삭제
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-slate-500">저장된 이력이 없습니다.</p>
          <Link
            href="/"
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            보고서 생성하러 가기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <Link href={`/history/${item.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.subjectEmoji}</span>
                    <span className="font-semibold text-slate-800">{item.subjectName}</span>
                    <div className="flex gap-1">
                      {item.report && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">
                          보고서
                        </span>
                      )}
                      {item.setech && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-600">
                          세특
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">{item.topic}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>{new Date(item.createdAt).toLocaleString('ko-KR')}</span>
                    {item.report && (
                      <>
                        <span>·</span>
                        <span>{LENGTH_LABEL[item.length]} · {TONE_LABEL[item.tone]}</span>
                      </>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
