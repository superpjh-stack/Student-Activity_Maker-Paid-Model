import type { HistoryItem } from '@/types';

const STORAGE_KEY = 'saenggibu_history';

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem {
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const history = getHistory();
  const updated = [newItem, ...history].slice(0, 100); // 최대 100개
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newItem;
}

export function getHistoryItem(id: string): HistoryItem | null {
  return getHistory().find((item) => item.id === id) ?? null;
}

export function deleteHistoryItem(id: string): void {
  const updated = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
