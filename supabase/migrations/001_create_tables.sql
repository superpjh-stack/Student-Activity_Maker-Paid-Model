-- ============================================================
-- 001_create_tables.sql
-- AI 생기부 Maker — 구독 서비스 테이블 생성
-- Supabase SQL Editor에 순서대로 실행하세요
-- ============================================================

-- ------------------------------------------------------------
-- 1. users 테이블
-- NextAuth signIn 콜백에서 upsert 됨
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  image         TEXT,
  -- 학생 프로필
  school        TEXT,
  grade         SMALLINT CHECK (grade IN (1, 2, 3)),
  class_number  SMALLINT,
  target_univ   TEXT,
  target_major  TEXT,
  career_tags   TEXT[]        DEFAULT '{}',
  exam_date     DATE,
  -- 추천 코드 (6자리 대문자, 가입 시 자동 생성)
  referral_code TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_at    TIMESTAMPTZ   DEFAULT now(),
  updated_at    TIMESTAMPTZ   DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. subscriptions 테이블
-- 사용자당 1개, service_role로만 INSERT/UPDATE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'standard', 'premium')),
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end    TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '100 years'),
  cancel_at_period_end  BOOLEAN       DEFAULT false,
  toss_billing_key      TEXT,         -- Toss Payments 빌링키 (카드 등록 후 발급)
  toss_customer_key     TEXT,         -- Toss 고객 키
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ   DEFAULT now(),
  updated_at            TIMESTAMPTZ   DEFAULT now(),
  UNIQUE(user_id)
);

-- ------------------------------------------------------------
-- 3. usage_records 테이블
-- 월별 생성 횟수 카운트 (increment_usage RPC로 증가)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_records (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type      TEXT    NOT NULL CHECK (type IN ('seteok', 'report')),
  month     TEXT    NOT NULL,   -- 'YYYY-MM' 형식
  count     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, type, month)
);

-- ------------------------------------------------------------
-- 4. usage_credits 테이블
-- 추천 코드, 이벤트 등으로 추가된 크레딧
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_credits (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('seteok', 'report')),
  amount     INTEGER     NOT NULL CHECK (amount > 0),
  reason     TEXT,       -- 'referral', 'event', 'admin'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 5. seteok_history 테이블
-- AI 생성 이력 (세특 / 탐구보고서)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seteok_history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id   TEXT        NOT NULL,
  subject_name TEXT        NOT NULL,
  type         TEXT        NOT NULL CHECK (type IN ('seteok', 'report')),
  topic        TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  char_count   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 6. referrals 테이블
-- 추천인(referrer) → 피추천인(referee) 관계
-- referee_id UNIQUE: 피추천인은 한 번만 사용 가능
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referee_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ,
  credits_granted BOOLEAN     DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referee_id)
);
