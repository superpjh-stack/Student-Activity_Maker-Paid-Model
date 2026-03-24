---
feature: subscription
type: design
created: 2026-03-19
author: Claude (통합 설계)
status: active
level: Dynamic
---

# AI 생기부 Maker — 구독 서비스 전환 Design

**버전**: 1.0 | **작성일**: 2026-03-19
**PDCA Phase**: Design
**기반 문서**:
- Plan: `docs/01-plan/features/subscription.plan.md`
- 랜딩 UX: `docs/02-design/features/subscription-landing.design.md`
- 대시보드 UX: `docs/02-design/features/subscription-dashboard.design.md`
- 프로토타입: `docs/prototypes/subscription-landing.html`, `docs/prototypes/subscription-dashboard.html`

---

## 1. 설계 원칙

| 원칙 | 적용 |
|------|------|
| **최소 변경** | 기존 API (`generate-report`, `generate-setech` 등) 건드리지 않고 미들웨어 레이어로 사용량 제어 |
| **점진적 전환** | 무료 플랜 = 현행 서비스, 유료 플랜 = 기능 확장. 기존 사용자는 자동 무료 플랜 |
| **서버 컴포넌트 우선** | 대시보드/마이페이지는 Server Component로 초기 데이터 로드, 인터랙션만 Client |
| **결제 보안** | 결제 정보 서버 비보관, Toss Payments 토큰화 처리, Webhook 서명 검증 필수 |

---

## 2. 파일 구조 (신규 추가)

```
src/
├── app/
│   ├── (auth)/                     # 인증 레이아웃 그룹
│   │   ├── login/
│   │   │   └── page.tsx            # 카카오 로그인 페이지
│   │   └── layout.tsx
│   │
│   ├── dashboard/
│   │   └── page.tsx                # 구독자 대시보드 (Server Component)
│   │
│   ├── my/
│   │   └── page.tsx                # 마이페이지 (Server Component)
│   │
│   ├── pricing/
│   │   └── page.tsx                # 프라이싱 페이지 (랜딩 일부)
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts        # NextAuth 핸들러
│       │
│       ├── subscription/
│       │   ├── create/route.ts     # 구독 생성 (결제 시작)
│       │   ├── cancel/route.ts     # 구독 취소
│       │   ├── webhook/route.ts    # Toss Payments Webhook
│       │   └── status/route.ts     # 구독 상태 조회
│       │
│       ├── usage/
│       │   ├── check/route.ts      # 사용량 체크 (생성 전 호출)
│       │   └── increment/route.ts  # 사용량 증가 (생성 완료 후)
│       │
│       ├── profile/
│       │   └── route.ts            # 프로필 조회/수정
│       │
│       └── referral/
│           ├── generate/route.ts   # 추천 코드 발급
│           └── apply/route.ts      # 추천 코드 적용
│
├── components/
│   ├── dashboard/
│   │   ├── DdayWidget.tsx          # 수능 D-day 카운트다운
│   │   ├── SubjectTracker.tsx      # 8과목 완성도 트래커
│   │   ├── UsageBar.tsx            # 이번 달 사용량 바
│   │   ├── RecentActivity.tsx      # 최근 활동 카드
│   │   └── InviteBanner.tsx        # 친구 초대 배너 (FREE only)
│   │
│   ├── my/
│   │   ├── ProfileForm.tsx         # 프로필 편집 폼
│   │   ├── SubscriptionCard.tsx    # 현재 구독 카드
│   │   ├── PortfolioTabs.tsx       # 세특 포트폴리오
│   │   └── NotificationSettings.tsx # 알림 설정
│   │
│   ├── upsell/
│   │   ├── UpgradeModal.tsx        # 한도 초과 모달/바텀시트
│   │   ├── UsageBanner.tsx         # 70% 이상 시 업셀 배너
│   │   └── PlanBadge.tsx           # 플랜 배지 (FREE/STANDARD/PREMIUM)
│   │
│   └── auth/
│       └── LoginButton.tsx         # 카카오 로그인 버튼
│
├── lib/
│   ├── auth.ts                     # NextAuth 설정
│   ├── supabase.ts                 # Supabase 클라이언트
│   ├── subscription.ts             # 구독 헬퍼 함수
│   ├── usage.ts                    # 사용량 체크/증가 헬퍼
│   └── toss.ts                     # Toss Payments API 헬퍼
│
└── types/
    └── subscription.ts             # 구독 관련 타입
```

---

## 3. 데이터베이스 설계 (Supabase)

### 3-1. 테이블 정의

#### `users` (기존 NextAuth 확장)
```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  image        TEXT,
  -- 학생 프로필
  school       TEXT,
  grade        SMALLINT CHECK (grade IN (1, 2, 3)),
  class_number SMALLINT,
  target_univ  TEXT,
  target_major TEXT,
  career_tags  TEXT[] DEFAULT '{}',  -- 최대 3개
  exam_date    DATE,                 -- 수능일
  referral_code TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
```

#### `subscriptions`
```sql
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL CHECK (plan IN ('free', 'standard', 'premium')),
  status                TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start  TIMESTAMPTZ NOT NULL,
  current_period_end    TIMESTAMPTZ NOT NULL,
  cancel_at_period_end  BOOLEAN DEFAULT false,
  toss_subscription_id  TEXT,        -- Toss Payments 빌링키
  toss_customer_key     TEXT,        -- Toss 고객 키
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)        -- 사용자당 1개 구독
);
```

#### `usage_records`
```sql
CREATE TABLE usage_records (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  type      TEXT NOT NULL CHECK (type IN ('seteok', 'report')),
  month     TEXT NOT NULL,   -- YYYY-MM 형식
  count     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, type, month)
);

-- 인덱스
CREATE INDEX idx_usage_user_month ON usage_records(user_id, month);
```

#### `seteok_history` (기존 localStorage 이력 → DB 이관)
```sql
CREATE TABLE seteok_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id  TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('seteok', 'report')),
  topic       TEXT NOT NULL,
  content     TEXT NOT NULL,
  char_count  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_history_user ON seteok_history(user_id, created_at DESC);
CREATE INDEX idx_history_subject ON seteok_history(user_id, subject_id);
```

#### `referrals`
```sql
CREATE TABLE referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  referee_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ,   -- 첫 생성 완료 시점
  credits_granted BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referee_id)   -- 피추천인은 1회만
);
```

#### `usage_credits` (추천 코드 크레딧 별도 관리)
```sql
CREATE TABLE usage_credits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('seteok', 'report')),
  amount     INTEGER NOT NULL,
  reason     TEXT,   -- 'referral', 'event', 'admin'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3-2. Row Level Security (RLS)

```sql
-- users 테이블
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self" ON users
  FOR ALL USING (auth.uid() = id);

-- subscriptions 테이블
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_self" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE는 service_role만 허용

-- usage_records 테이블
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_read_self" ON usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- seteok_history 테이블
ALTER TABLE seteok_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_self" ON seteok_history
  FOR ALL USING (auth.uid() = user_id);
```

---

## 4. 인증 설계 (NextAuth.js + Kakao OAuth)

### 4-1. 설정 (`src/lib/auth.ts`)

```typescript
import NextAuth from 'next-auth';
import KakaoProvider from 'next-auth/providers/kakao';
import { createClient } from './supabase';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Supabase에 사용자 upsert
      const supabase = createClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }, { onConflict: 'email' });

      // 무료 구독 자동 생성 (신규 사용자)
      await ensureFreeSubscription(supabase, user.id!);
      return true;
    },
    async session({ session, token }) {
      // 구독 정보를 session에 포함
      session.user.id = token.sub!;
      const plan = await getUserPlan(token.sub!);
      session.user.plan = plan;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
```

### 4-2. 환경 변수

```env
# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Kakao OAuth (developers.kakao.com)
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Toss Payments
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_WEBHOOK_SECRET=
```

---

## 5. 사용량 제어 설계

### 5-1. 플랜별 한도

```typescript
// src/lib/usage.ts
export const PLAN_LIMITS = {
  free:     { seteok: 3,    report: 1    },
  standard: { seteok: 20,   report: 10   },
  premium:  { seteok: null, report: null },  // null = 무제한
} as const;
```

### 5-2. 사용량 체크 플로우

```
[생성 버튼 클릭]
      ↓
POST /api/usage/check
  { userId, type: 'seteok'|'report' }
      ↓
  현재 월 사용량 조회 (usage_records)
  + 크레딧 조회 (usage_credits)
  + 플랜 한도 조회 (subscriptions)
      ↓
  used < limit?
  ├── YES → { allowed: true, remaining: N }
  └── NO  → { allowed: false, reason: 'limit_exceeded' }
      ↓
[allowed=false] → UpgradeModal 표시
[allowed=true]  → 생성 API 호출
      ↓
POST /api/usage/increment
  { userId, type }  → usage_records count++
```

### 5-3. 사용량 체크 API (`/api/usage/check`)

```typescript
// 요청
interface UsageCheckRequest {
  type: 'seteok' | 'report';
}

// 응답
interface UsageCheckResponse {
  allowed: boolean;
  used: number;
  limit: number | null;    // null = 무제한
  remaining: number | null;
  resetDate: string;       // 다음 달 1일
  reason?: 'limit_exceeded' | 'subscription_inactive';
}
```

---

## 6. 결제 설계 (Toss Payments)

### 6-1. 구독 결제 시퀀스

```
[사용자] 업그레이드 클릭
      ↓
[Frontend] POST /api/subscription/create
  { plan: 'standard'|'premium', period: 'monthly'|'annual' }
      ↓
[Backend] Toss 빌링키 발급 요청
  → 카드 등록 리다이렉트 URL 반환
      ↓
[Frontend] Toss 카드 등록 페이지로 리다이렉트
      ↓
[Toss] 카드 등록 완료 → 콜백 URL 호출
      ↓
[Backend] 빌링키 수령 → 최초 결제 실행
      ↓
[Toss] 결제 성공 Webhook → /api/subscription/webhook
      ↓
[Backend] subscriptions 테이블 업데이트
  plan = 'standard'|'premium', status = 'active'
      ↓
[Frontend] 대시보드 리다이렉트 (플랜 업그레이드 완료)
```

### 6-2. Webhook 처리 (`/api/subscription/webhook`)

```typescript
// 검증 후 처리할 이벤트 타입
type TossWebhookEvent =
  | 'PAYMENT_STATUS_CHANGED'   // 결제 상태 변경
  | 'BILLING_STATUS_CHANGED';  // 빌링 상태 변경

// Webhook 서명 검증 (필수)
const isValid = verifyWebhookSignature(
  req.headers['toss-payments-signature'],
  rawBody,
  process.env.TOSS_WEBHOOK_SECRET!
);
```

### 6-3. 가격표

```typescript
export const PRICING = {
  standard: { monthly: 9900, annual: 79000 },
  premium:  { monthly: 19900, annual: 149000 },
} as const;
```

---

## 7. 페이지 설계

### 7-1. 랜딩 페이지 (`/`) 수정

기존 홈페이지에 아래 섹션 추가:
- Hero 섹션 개선 (현재 단순 타이틀 → Before/After 세특 비교)
- 프라이싱 카드 섹션 추가 (하단)
- 소셜 프루프 수치 배너 추가

**수정 대상**: `src/app/page.tsx`
- 현재: 단순 주제 선택 UI
- 목표: 비로그인 상태 → 랜딩 구조, 로그인 상태 → 생성 UI

### 7-2. 대시보드 (`/dashboard`)

```typescript
// src/app/dashboard/page.tsx (Server Component)
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  // 병렬 데이터 패치
  const [profile, usage, history, subscription] = await Promise.all([
    getUserProfile(session.user.id),
    getUsageStats(session.user.id),
    getRecentHistory(session.user.id, 5),
    getSubscription(session.user.id),
  ]);

  return (
    <div>
      <DdayWidget examDate={profile.examDate} />
      <SubjectTracker userId={session.user.id} history={history} />
      <UsageBar usage={usage} subscription={subscription} />
      <RecentActivity activities={history} />
      {subscription.plan === 'free' && <InviteBanner referralCode={profile.referralCode} />}
    </div>
  );
}
```

### 7-3. 마이페이지 (`/my`)

```typescript
// src/app/my/page.tsx (Server Component)
// 탭: 프로필 | 구독 | 포트폴리오 | 알림설정
// 탭 전환은 searchParams 기반 (?tab=profile|subscription|portfolio|notifications)
```

### 7-4. 로그인 (`/login`)

```typescript
// src/app/(auth)/login/page.tsx
// 카카오 로그인 단일 버튼
// 로그인 후 ?callbackUrl 파라미터 또는 /dashboard 리다이렉트
```

---

## 8. 컴포넌트 설계

### 8-1. `UsageBar.tsx`

```typescript
interface UsageBarProps {
  used: number;
  limit: number | null;
  type: 'seteok' | 'report';
  plan: 'free' | 'standard' | 'premium';
}

// 표시 로직:
// - limit=null (premium): "무제한 ∞" 표시, 바 없음
// - used/limit < 0.7: 초록 (여유 있어요 👍)
// - 0.7 <= ratio < 0.9: 노랑 + 경고 문구
// - ratio >= 0.9: 빨강 + <UsageBanner> 표시
```

### 8-2. `UpgradeModal.tsx`

```typescript
interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'limit_exceeded' | 'feature_locked';
  feature?: string;  // trigger='feature_locked' 시 기능명
  currentPlan: 'free' | 'standard';
}

// 모바일: bottom sheet (translate-y 애니메이션)
// 데스크탑: 센터 모달
// 내용: 현재 플랜 vs 다음 플랜 비교표 + [업그레이드] CTA + "다음 달까지 기다리기"
```

### 8-3. `SubjectTracker.tsx`

```typescript
interface SubjectTrackerProps {
  history: SeteokHistory[];
}

// 8과목 고정: 국어, 수학, 영어, 한국사, 사회, 과학, 예체능, 진로활동
// 상태 계산: 과목별 history count
//   - count = 0: 'none' (회색 점선)
//   - count >= 1 && count < 3: 'in_progress' (연보라)
//   - count >= 3: 'done' (핑크-보라 그라디언트 + 체크)
// 레이아웃: grid grid-cols-2 sm:grid-cols-4
```

### 8-4. `DdayWidget.tsx`

```typescript
interface DdayWidgetProps {
  examDate?: string;  // ISO 날짜. null이면 수능일 자동 계산
}

// 수능일 자동 계산: 매년 11월 둘째 목요일
// D-30 이내: text-red-500
// D-100 이내: text-yellow-500
// D-100 초과: gradient-text (fuchsia-pink)
```

---

## 9. 네비게이션 수정

현재 `src/app/layout.tsx` 수정:

```typescript
// 추가할 내용:
// 1. 로그인 상태 확인 (auth() 호출)
// 2. 로그인 시: [대시보드] [마이] [로그아웃] 버튼
// 3. 비로그인 시: [로그인] 버튼
// 4. PlanBadge 컴포넌트 (FREE/STANDARD/PREMIUM)
```

---

## 10. API 엔드포인트 명세

### 10-1. 구독 API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/subscription/create` | 구독 결제 시작 | 필요 |
| POST | `/api/subscription/cancel` | 구독 취소 | 필요 |
| POST | `/api/subscription/webhook` | Toss Webhook | 서명검증 |
| GET  | `/api/subscription/status` | 구독 상태 조회 | 필요 |

### 10-2. 사용량 API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET  | `/api/usage/check?type=seteok` | 생성 전 한도 체크 | 필요 |
| POST | `/api/usage/increment` | 생성 완료 후 카운트 | 필요 |

### 10-3. 프로필 API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET  | `/api/profile` | 프로필 조회 | 필요 |
| PATCH | `/api/profile` | 프로필 수정 | 필요 |

### 10-4. 기존 API 수정 사항

기존 `/api/generate-report`, `/api/generate-setech` 등은 **수정 불필요**.
대신 Frontend에서 생성 전 `/api/usage/check` 호출하여 gate 역할 수행.
생성 완료 후 `/api/usage/increment` 호출.

---

## 11. 타입 정의 (`src/types/subscription.ts`)

```typescript
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
  creditsExtra: number;          // 추천 코드 크레딧
  resetDate: string;             // 다음 달 1일 ISO
}

export interface StudentProfile {
  id: string;
  name: string;
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

// NextAuth 세션 확장
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
```

---

## 12. 구현 순서 (Do Phase 가이드)

### Phase 1 — 기반 인프라 (Sprint 1)
1. `npm install next-auth @auth/supabase-adapter` + Supabase 설정
2. DB 테이블 생성 (Supabase SQL Editor)
3. `src/lib/auth.ts` — NextAuth + Kakao 설정
4. `src/app/api/auth/[...nextauth]/route.ts` 생성
5. `src/lib/usage.ts` — 사용량 체크/증가 로직
6. `/api/usage/check`, `/api/usage/increment` 라우트
7. `src/lib/toss.ts` — Toss Payments 헬퍼
8. `/api/subscription/create`, `/api/subscription/webhook` 라우트

### Phase 2 — UI 페이지 (Sprint 2)
1. `src/app/(auth)/login/page.tsx` — 카카오 로그인 페이지
2. `src/app/layout.tsx` 수정 — 인증 상태 반영
3. `src/components/upsell/UpgradeModal.tsx`
4. 기존 생성 UI에 사용량 게이트 연결
5. `src/app/dashboard/page.tsx` + 하위 컴포넌트
6. `src/app/my/page.tsx` + 하위 컴포넌트

### Phase 3 — 성장 기능 (Sprint 3)
1. 이메일 알림 (Resend API)
2. 친구 초대 시스템
3. 구독 취소 설득 플로우
4. 연간 구독 처리

---

## 13. 연관 문서

- Plan: `docs/01-plan/features/subscription.plan.md`
- 구독 모델 전략: `docs/01-plan/features/subscription-model.plan.md`
- 사용자 여정: `docs/01-plan/features/subscription-user-journey.plan.md`
- 랜딩 UX: `docs/02-design/features/subscription-landing.design.md`
- 대시보드 UX: `docs/02-design/features/subscription-dashboard.design.md`
- 랜딩 프로토타입: `docs/prototypes/subscription-landing.html`
- 대시보드 프로토타입: `docs/prototypes/subscription-dashboard.html`

---

*작성: Claude (통합 설계) | 2026-03-19*
*다음 단계: `/pdca do subscription` — 구현 시작*
