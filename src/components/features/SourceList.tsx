'use client';

import type { SourceItem } from '@/types';

interface SourceListProps {
  sources: SourceItem[];
  loading: boolean;
}

function buildSearchUrls(keyword: string) {
  const encoded = encodeURIComponent(keyword);
  return {
    riss: `https://www.riss.kr/search/Search.do?searchGubun=all&query=${encoded}`,
    scholar: `https://scholar.google.com/scholar?q=${encoded}`,
    naver: `https://academic.naver.com/search.naver?query=${encoded}`,
  };
}

export default function SourceList({ sources, loading }: SourceListProps) {
  if (!loading && sources.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-slate-200">
      <h3 className="text-sm font-semibold text-violet-600 mb-3 flex items-center gap-2">
        <span>📚</span>
        <span>참고문헌</span>
        <span className="text-xs text-slate-400 font-normal">(AI 추천 — 클릭하면 검색 페이지로 이동)</span>
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
          <svg className="animate-spin h-4 w-4 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          참고문헌 생성 중...
        </div>
      ) : (
        <ol className="space-y-3">
          {sources.map((src, i) => {
            const urls = buildSearchUrls(src.keyword);
            return (
              <li key={i} className="text-sm">
                <div className="text-black leading-snug mb-1">
                  <span className="text-gray-500 mr-1.5">[{i + 1}]</span>
                  <span className="font-medium text-black">{src.title}</span>
                  {(src.author || src.year) && (
                    <span className="text-gray-600">
                      {src.author ? ` — ${src.author}` : ''}
                      {src.year ? ` (${src.year})` : ''}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 pl-5">
                  <a
                    href={urls.riss}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 transition-colors"
                  >
                    🔍 RISS
                  </a>
                  <a
                    href={urls.scholar}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300 hover:bg-green-500/40 transition-colors"
                  >
                    📖 Google Scholar
                  </a>
                  <a
                    href={urls.naver}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 transition-colors"
                  >
                    📰 NAVER 학술
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
