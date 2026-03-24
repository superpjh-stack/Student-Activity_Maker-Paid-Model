import Link from 'next/link';
import { SUBJECTS } from '@/lib/subjects';
import type { SubjectProgress } from '@/types/subscription';

interface SubjectTrackerProps {
  history: { subjectId: string; createdAt: string }[];
}

export default function SubjectTracker({ history }: SubjectTrackerProps) {
  // 과목별 생성 횟수 집계
  const countMap: Record<string, number> = {};
  for (const item of history) {
    countMap[item.subjectId] = (countMap[item.subjectId] ?? 0) + 1;
  }

  const subjects: SubjectProgress[] = SUBJECTS.map(s => {
    const count = countMap[s.id] ?? 0;
    return {
      subjectId: s.id,
      subjectName: s.name,
      emoji: s.emoji,
      status: count === 0 ? 'none' : count < 3 ? 'in_progress' : 'done',
      generationCount: count,
    };
  });

  const doneCount = subjects.filter(s => s.status === 'done').length;

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* 헤더 + 요약 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-purple-900">세특 완성도</h2>
        <span className="text-sm font-semibold text-purple-500">{doneCount}/{subjects.length} 완성</span>
      </div>

      {/* 전체 진행 바 */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-purple-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-pink-400 transition-all"
          style={{ width: `${(doneCount / subjects.length) * 100}%` }}
        />
      </div>

      {/* 8과목 그리드 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {subjects.map(s => (
          <Link
            key={s.subjectId}
            href={`/${s.subjectId}`}
            className={`relative rounded-xl p-3 transition-all active:scale-95 ${
              s.status === 'done'
                ? 'bg-gradient-to-br from-fuchsia-50 to-pink-50 border border-fuchsia-200'
                : s.status === 'in_progress'
                ? 'bg-purple-50 border border-purple-200'
                : 'border border-dashed border-gray-200 bg-gray-50'
            }`}
          >
            {s.status === 'done' && (
              <span className="absolute right-2 top-2 text-xs">✨</span>
            )}
            <p className="text-lg">{s.emoji}</p>
            <p className={`mt-1 text-xs font-medium ${
              s.status === 'done' ? 'text-fuchsia-700'
              : s.status === 'in_progress' ? 'text-purple-700'
              : 'text-gray-400'
            }`}>
              {s.subjectName}
            </p>
            <p className={`text-xs mt-0.5 ${
              s.status === 'done' ? 'text-fuchsia-500'
              : s.status === 'in_progress' ? 'text-purple-400'
              : 'text-red-400 font-semibold'
            }`}>
              {s.status === 'done' ? '완성 ✓'
               : s.status === 'in_progress' ? `${s.generationCount}회 생성`
               : '미시작!'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
