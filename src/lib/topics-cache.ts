// Rule 1: 과목별 추천 주제 일일 캐시 + 새로고침 지원
// 날짜 시드 기반으로 10개 풀에서 5개를 선택, 하루 동안 localStorage에 캐시
// 새로고침 버튼 클릭 시 offset 증가 → 다른 5개 선택

const CACHE_KEY = 'saenggibu_daily_topics';
const TOPICS_PER_SUBJECT = 5;

interface SubjectCache {
  offset: number;
  topics: string[];
}

interface DailyCache {
  date: string; // YYYY-MM-DD
  subjects: Record<string, SubjectCache>; // subjectId → {offset, topics}
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 날짜 + 과목 ID + offset을 시드로 한 결정론적 5개 선택
function selectByDateSeed(topics: string[], subjectId: string, dateStr: string, offset: number): string[] {
  const seedStr = `${dateStr}:${subjectId}:${offset}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) | 0;
  }

  const indices = Array.from({ length: topics.length }, (_, i) => i);
  const selected: number[] = [];

  let s = seed;
  while (selected.length < TOPICS_PER_SUBJECT && indices.length > 0) {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    const idx = Math.abs(s) % indices.length;
    selected.push(indices.splice(idx, 1)[0]);
  }

  return selected.map((i) => topics[i]);
}

function loadCache(): DailyCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 구 형식(subjects 없음) 또는 손상된 캐시 무효화
    if (!parsed?.subjects || typeof parsed.subjects !== 'object') {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed as DailyCache;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCache(cache: DailyCache): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// 현재 캐시된 주제 반환 (없으면 offset=0으로 새로 생성)
export function getDailyTopics(subjectId: string, allTopics: string[]): string[] {
  const today = getTodayString();
  const cache = loadCache();

  if (cache && cache.date === today && cache.subjects[subjectId]) {
    return cache.subjects[subjectId].topics;
  }

  const selected = selectByDateSeed(allTopics, subjectId, today, 0);
  const newCache: DailyCache = {
    date: today,
    subjects: {
      ...(cache?.date === today ? cache.subjects : {}),
      [subjectId]: { offset: 0, topics: selected },
    },
  };
  saveCache(newCache);
  return selected;
}

// 새로고침: offset 증가 후 새 5개 선택
export function refreshDailyTopics(subjectId: string, allTopics: string[]): string[] {
  const today = getTodayString();
  const cache = loadCache();

  const currentOffset = cache?.date === today ? (cache.subjects[subjectId]?.offset ?? 0) : 0;
  const nextOffset = currentOffset + 1;

  const selected = selectByDateSeed(allTopics, subjectId, today, nextOffset);
  const newCache: DailyCache = {
    date: today,
    subjects: {
      ...(cache?.date === today ? cache.subjects : {}),
      [subjectId]: { offset: nextOffset, topics: selected },
    },
  };
  saveCache(newCache);
  return selected;
}
