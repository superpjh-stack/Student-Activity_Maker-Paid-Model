'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSubjectById } from '@/lib/subjects';
import { getDailyTopics, refreshDailyTopics } from '@/lib/topics-cache';

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.subject as string;
  const subject = getSubjectById(subjectId);

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [dailyTopics, setDailyTopics] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (subject) {
      setDailyTopics(getDailyTopics(subject.id, subject.topics));
    }
  }, [subject]);

  if (!subject) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">과목을 찾을 수 없습니다.</p>
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

  const activeTopic = customTopic.trim() || selectedTopic;

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    setCustomTopic('');
  };

  const handleCustomInput = (value: string) => {
    setCustomTopic(value);
    if (value.trim()) {
      setSelectedTopic(null);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedTopic(null);
    // 짧은 애니메이션 효과 후 새 주제 표시
    setTimeout(() => {
      const newTopics = refreshDailyTopics(subject.id, subject.topics);
      setDailyTopics(newTopics);
      setRefreshing(false);
    }, 300);
  };

  const handleNext = () => {
    if (activeTopic) {
      const searchParams = new URLSearchParams({
        subject: subjectId,
        topic: activeTopic,
      });
      router.push(`/generate?${searchParams.toString()}`);
    }
  };

  return (
    <div className="py-12">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="text-slate-500 hover:text-slate-700"
        >
          ← 뒤로
        </button>
      </div>

      {/* Steps */}
      <div className="mb-8 flex items-center justify-center gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">✓</span>
          <span>과목 선택</span>
        </div>
        <div className="h-px w-6 bg-indigo-400" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">2</span>
          <span>주제 선택</span>
        </div>
        <div className="h-px w-6 bg-slate-300" />
        <div className="flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-500">3</span>
          <span>AI 생성</span>
        </div>
      </div>

      {/* Subject info */}
      <h2 className="mb-1 text-lg font-semibold text-slate-800">
        {subject.emoji} {subject.name} 탐구 주제를 선택하세요
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        추천 주제를 선택하거나 직접 입력할 수 있습니다
      </p>

      {/* Topic list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">오늘의 추천 주제</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition-all hover:bg-indigo-100 disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
            주제 다시 요청
          </button>
        </div>

        <div className={`space-y-3 transition-opacity duration-300 ${refreshing ? 'opacity-0' : 'opacity-100'}`}>
          {dailyTopics.map((topic, idx) => (
            <button
              key={`${topic}-${idx}`}
              onClick={() => handleSelectTopic(topic)}
              className={`w-full rounded-lg border-2 p-4 text-left text-sm transition-all ${
                selectedTopic === topic && !customTopic.trim()
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span
                className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                  selectedTopic === topic && !customTopic.trim()
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-slate-300'
                }`}
              >
                {selectedTopic === topic && !customTopic.trim() ? '●' : ''}
              </span>
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Custom input */}
      <div className="mt-6">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-px flex-1 bg-slate-200" />
          <span>또는 직접 입력</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <input
          type="text"
          value={customTopic}
          onChange={(e) => handleCustomInput(e.target.value)}
          placeholder="탐구하고 싶은 주제를 직접 입력하세요..."
          className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Next button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleNext}
          disabled={!activeTopic}
          className={`rounded-lg px-8 py-3 text-base font-medium transition-colors ${
            activeTopic
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
