'use client';

import { useState, useEffect } from 'react';

const NOTIFICATIONS = [
  { id: 'deadline', label: '마감 임박 알림', desc: 'D-30, D-14, D-7', defaultOn: true },
  { id: 'weekly', label: '세특 미완성 알림', desc: '매주 일요일', defaultOn: true },
  { id: 'update', label: '신기능 & 업데이트 알림', desc: '가끔', defaultOn: true },
  { id: 'promo', label: '이벤트/프로모션 알림', desc: '가끔', defaultOn: false },
];

const DEFAULT_SETTINGS = Object.fromEntries(NOTIFICATIONS.map(n => [n.id, n.defaultOn]));

export default function NotificationSettings() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // 서버에서 초기 설정 로드
  useEffect(() => {
    fetch('/api/profile/notifications')
      .then(r => r.json())
      .then(({ settings }) => {
        if (settings && typeof settings === 'object') {
          setToggles(prev => ({ ...prev, ...settings }));
        }
      })
      .catch(() => {/* 로드 실패 시 기본값 유지 */});
  }, []);

  const handleToggle = async (id: string) => {
    const next = { ...toggles, [id]: !toggles[id] };
    setToggles(next);

    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/profile/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: next }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-purple-900">알림 설정</h3>
        {saving && <span className="text-xs text-slate-400">저장 중…</span>}
        {!saving && saveStatus === 'saved' && <span className="text-xs text-green-500">저장됨 ✓</span>}
        {!saving && saveStatus === 'error' && <span className="text-xs text-red-400">저장 실패</span>}
      </div>
      {NOTIFICATIONS.map(n => (
        <div key={n.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-900">{n.label}</p>
            <p className="text-xs text-purple-300">{n.desc}</p>
          </div>
          <button
            onClick={() => handleToggle(n.id)}
            disabled={saving}
            className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${
              toggles[n.id] ? 'bg-fuchsia-500' : 'bg-gray-200'
            }`}
            aria-label={n.label}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                toggles[n.id] ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
