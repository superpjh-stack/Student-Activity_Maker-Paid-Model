'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSubjectById } from '@/lib/subjects';
import { getDailyTopics, refreshDailyTopics } from '@/lib/topics-cache';
import CoachingModal from '@/components/features/CoachingModal';

const STEPS = ['과목 선택', '주제 선택', 'AI 생성'];

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.subject as string;
  const subject = getSubjectById(subjectId);

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [dailyTopics, setDailyTopics] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCoaching, setShowCoaching] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);

  useEffect(() => {
    if (subject) {
      setDailyTopics(getDailyTopics(subject.id, subject.topics));
    }
  }, [subject]);

  if (!subject) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center">
          <span className="text-4xl">😅</span>
          <p className="mt-3 text-base font-medium text-slate-600">과목을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-sm font-medium text-violet-600 hover:underline"
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
    if (value.trim()) setSelectedTopic(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSelectedTopic(null);
    setTimeout(() => {
      const newTopics = refreshDailyTopics(subject.id, subject.topics);
      setDailyTopics(newTopics);
      setRefreshing(false);
    }, 300);
  };

  const navigateToGenerate = (topic: string, coaching?: { motivation: string; activity: string; curiosity: string }) => {
    const p: Record<string, string> = { subject: subjectId, topic };
    if (coaching?.motivation) p.motivation = coaching.motivation;
    if (coaching?.activity) p.activity = coaching.activity;
    if (coaching?.curiosity) p.curiosity = coaching.curiosity;
    router.push(`/generate?${new URLSearchParams(p).toString()}`);
  };

  const handleNext = () => {
    if (activeTopic) {
      setPendingTopic(activeTopic);
      setShowCoaching(true);
    }
  };

  return (
    <div className="pb-16 pt-4">
      {/* ── Back ── */}
      <button
        onClick={() => router.push('/')}
        className="mb-6 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-all"
      >
        ← 뒤로
      </button>

      {/* ── Steps ── */}
      <div className="mb-8 flex items-center justify-center gap-1.5 sm:gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1.5 sm:gap-2">
            <div className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${
              i <= 1
                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-200'
                : 'bg-slate-100 text-slate-400'
            }`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                i < 1 ? 'bg-white/30 text-white' : i === 1 ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-400'
              }`}>{i < 1 ? '✓' : i + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-3 sm:w-4 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* ── Subject badge ── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="glass-card inline-flex items-center gap-2 rounded-2xl px-4 py-2.5">
          <span className="text-2xl">{subject.emoji}</span>
          <div>
            <p className="text-xs text-slate-400">선택된 과목</p>
            <p className="text-sm font-bold text-slate-800">{subject.name}</p>
          </div>
        </div>
      </div>

      <h2 className="mb-1 text-base font-bold text-slate-800">
        탐구 주제를 선택해 주세요
      </h2>
      <p className="mb-6 text-sm text-slate-500">
        오늘의 추천 주제 중 하나를 고르거나, 직접 입력하세요 ✍️
      </p>

      {/* ── Topic list header ── */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">📚 오늘의 추천 주제</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600 transition-all hover:bg-violet-100 disabled:opacity-50"
        >
          <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
          새 주제 받기
        </button>
      </div>

      {/* ── Topics ── */}
      <div className={`space-y-2.5 transition-opacity duration-300 ${refreshing ? 'opacity-0' : 'opacity-100'}`}>
        {dailyTopics.map((topic, idx) => (
          <button
            key={`${topic}-${idx}`}
            onClick={() => handleSelectTopic(topic)}
            className={`card-hover w-full rounded-2xl border-2 p-4 text-left text-sm font-medium transition-all ${
              selectedTopic === topic && !customTopic.trim()
                ? 'border-violet-400 bg-gradient-to-r from-violet-50 to-pink-50 shadow-sm shadow-violet-100'
                : 'glass-card border-transparent hover:border-violet-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs transition-all ${
                selectedTopic === topic && !customTopic.trim()
                  ? 'border-violet-500 bg-violet-500 text-white'
                  : 'border-slate-300 text-transparent'
              }`}>
                ●
              </span>
              <span className={selectedTopic === topic && !customTopic.trim() ? 'text-violet-900' : 'text-slate-700'}>
                {topic}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Custom input ── */}
      <div className="mt-6">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="font-medium">또는 직접 입력</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <input
          type="text"
          value={customTopic}
          onChange={(e) => handleCustomInput(e.target.value)}
          placeholder="탐구하고 싶은 주제를 직접 입력하세요..."
          className="mt-3 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
        />
      </div>

      {/* ── Next button ── */}
      <div className="mt-8">
        <button
          onClick={handleNext}
          disabled={!activeTopic}
          className={`w-full sm:w-auto sm:mx-auto sm:block rounded-full px-10 py-4 text-base font-bold transition-all active:scale-95 ${
            activeTopic
              ? 'btn-gradient text-white cursor-pointer'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          다음 단계 →
        </button>
      </div>

      {/* ── Coaching Modal ── */}
      {subject && pendingTopic && (
        <CoachingModal
          isOpen={showCoaching}
          subjectName={subject.name}
          topic={pendingTopic}
          onComplete={(answers) => {
            setShowCoaching(false);
            navigateToGenerate(pendingTopic, answers);
          }}
          onSkip={() => {
            setShowCoaching(false);
            navigateToGenerate(pendingTopic);
          }}
        />
      )}
    </div>
  );
}
