'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExpandedTopic {
  subject: string;
  subjectId: string;
  color: string;
  topic: string;
}

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
};

export default function TopicExpanderSection() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [topics, setTopics] = useState<ExpandedTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleExpand = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch('/api/expand-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      if (!res.ok) throw new Error('주제 탐색에 실패했습니다.');
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch {
      setError('주제 탐색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (t: ExpandedTopic) => {
    const params = new URLSearchParams({ subject: t.subjectId, topic: t.topic });
    router.push(`/generate?${params.toString()}`);
  };

  return (
    <div className="mt-10 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
      <p className="mb-1 text-sm font-semibold text-indigo-700">탐구 주제 확장기</p>
      <p className="mb-4 text-xs text-slate-500">
        관심 키워드를 입력하면 8개 과목 관점의 탐구 주제를 찾아드려요
      </p>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExpand()}
          placeholder="예: 기후변화, 인공지능, 운동"
          maxLength={30}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          onClick={handleExpand}
          disabled={loading || !keyword.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {loading ? '탐색 중...' : '탐색'}
        </button>
      </div>

      {/* Error */}
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      {/* Results */}
      {!loading && searched && topics.length === 0 && !error && (
        <p className="mt-4 text-center text-sm text-slate-400">결과를 찾지 못했습니다. 다른 키워드를 시도해보세요.</p>
      )}

      {topics.length > 0 && (
        <div className="mt-4">
          <p className="mb-3 text-xs font-medium text-slate-500">
            &ldquo;{keyword}&rdquo; 관련 탐구 주제 {topics.length}개
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {topics.map((t, i) => (
              <button
                key={i}
                onClick={() => handleTopicSelect(t)}
                className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm ${COLOR_MAP[t.color] ?? 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <p className="text-xs font-semibold">{t.subject}</p>
                <p className="mt-1 text-xs leading-relaxed">{t.topic}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
