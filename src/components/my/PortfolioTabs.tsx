'use client';

import { useState } from 'react';
import type { Plan } from '@/types/subscription';
import { SUBJECTS } from '@/lib/subjects';

interface HistoryItem {
  id: string;
  subjectId: string;
  subjectName: string;
  type: 'seteok' | 'report';
  topic: string;
  content: string;
  charCount: number;
  createdAt: string;
}

interface PortfolioTabsProps {
  items: HistoryItem[];
  plan: Plan;
}

export default function PortfolioTabs({ items, plan }: PortfolioTabsProps) {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: `전체 (${items.length})` },
    ...SUBJECTS.filter(s => items.some(i => i.subjectId === s.id)).map(s => ({
      id: s.id,
      label: `${s.emoji} ${s.name}`,
    })),
  ];

  const filtered = activeTab === 'all' ? items : items.filter(i => i.subjectId === activeTab);

  const copyToClipboard = async (content: string) => {
    await navigator.clipboard.writeText(content);
    alert('복사되었어요!');
  };

  return (
    <div className="space-y-4">
      {/* PDF 일괄 다운로드 배너 */}
      <div className={`rounded-2xl p-4 flex items-center justify-between ${
        plan !== 'free' ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border border-gray-100'
      }`}>
        <div>
          <p className={`text-sm font-bold ${plan !== 'free' ? 'text-purple-900' : 'text-gray-400'}`}>
            전체 {items.length}개 세특을 PDF로 저장
          </p>
          <p className={`text-xs mt-0.5 ${plan !== 'free' ? 'text-purple-400' : 'text-gray-300'}`}>
            {plan === 'free' ? '준비생 이상 플랜에서 사용 가능' : '포트폴리오 PDF 다운로드'}
          </p>
        </div>
        <button
          disabled={plan === 'free'}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            plan !== 'free'
              ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {plan === 'free' ? '🔒 잠금' : '다운로드'}
        </button>
      </div>

      {/* 과목 탭 (가로 스크롤) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-fuchsia-500 text-white'
                : 'border border-purple-100 text-purple-500 hover:border-fuchsia-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 세특 카드 목록 */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-purple-300">아직 생성한 항목이 없어요</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const subj = SUBJECTS.find(s => s.id === item.subjectId);
            const date = new Date(item.createdAt);
            return (
              <div key={item.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{subj?.emoji ?? '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        item.type === 'seteok' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {item.type === 'seteok' ? '세특' : '탐구'}
                      </span>
                      <span className="text-xs text-purple-300">
                        {date.getFullYear()}.{date.getMonth() + 1}.{date.getDate()}
                      </span>
                      <span className="text-xs text-purple-300">{item.charCount.toLocaleString()}자</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-purple-900 truncate">{item.topic}</p>
                    <p className="mt-0.5 text-xs text-purple-400 line-clamp-2">{item.content}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => copyToClipboard(item.content)}
                    className="rounded-lg border border-purple-100 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    복사
                  </button>
                  <button
                    disabled={plan === 'free'}
                    className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                      plan !== 'free'
                        ? 'border border-purple-100 text-purple-600 hover:bg-purple-50'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {plan === 'free' ? '🔒 공유 링크' : '공유 링크'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
