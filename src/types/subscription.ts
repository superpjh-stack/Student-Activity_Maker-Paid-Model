export type Plan = 'free' | 'standard' | 'premium';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due';

export interface UserSubscription {
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  nextBillingDate?: string;
  price?: number;
}

export interface UsageStats {
  plan: Plan;
  seteokUsed: number;
  seteokLimit: number | null;   // null = 무제한
  reportUsed: number;
  reportLimit: number | null;
  creditsExtra: number;          // 추천 코드 등으로 추가된 크레딧
  resetDate: string;             // 다음 달 1일 ISO
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  school?: string;
  grade?: 1 | 2 | 3;
  classNumber?: number;
  targetUniv?: string;
  targetMajor?: string;
  careerTags: string[];
  examDate?: string;
  referralCode: string;
}

export interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  emoji: string;
  status: 'none' | 'in_progress' | 'done';
  generationCount: number;
  lastGeneratedAt?: string;
}

export interface UsageCheckResponse {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  resetDate: string;
  reason?: 'limit_exceeded' | 'subscription_inactive' | 'unauthenticated';
}

export const PLAN_LIMITS: Record<Plan, { seteok: number | null; report: number | null }> = {
  free:     { seteok: 3,    report: 1    },
  standard: { seteok: 20,   report: 10   },
  premium:  { seteok: null, report: null },
};

export const PLAN_LABELS: Record<Plan, string> = {
  free:     '탐구생',
  standard: '준비생',
  premium:  '입시생',
};

export const PLAN_COLORS: Record<Plan, string> = {
  free:     'bg-gray-100 text-gray-600',
  standard: 'bg-blue-100 text-blue-600',
  premium:  'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white',
};

// NextAuth 세션 타입 확장
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      plan: Plan;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
