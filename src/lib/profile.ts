import type { UserProfile } from '@/types';

const PROFILE_KEY = 'sam_profile';

export function saveProfile(profile: Omit<UserProfile, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ ...profile, savedAt: new Date().toISOString() })
  );
}

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}
