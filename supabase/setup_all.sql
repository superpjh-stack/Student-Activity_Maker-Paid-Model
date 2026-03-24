-- ============================================================
-- setup_all.sql
-- AI 생기부 Maker — Supabase 전체 셋업 (한 번에 실행)
-- Supabase 대시보드 → SQL Editor → New query → 붙여넣기 → Run
-- ============================================================

-- ============================================================
-- STEP 1: 테이블 생성
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  name          TEXT,
  image         TEXT,
  school        TEXT,
  grade         SMALLINT    CHECK (grade IN (1, 2, 3)),
  class_number  SMALLINT,
  target_univ   TEXT,
  target_major  TEXT,
  career_tags   TEXT[]      DEFAULT '{}',
  exam_date     DATE,
  referral_code TEXT        UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                  TEXT        NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'standard', 'premium')),
  status                TEXT        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end    TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '100 years'),
  cancel_at_period_end  BOOLEAN     DEFAULT false,
  toss_billing_key      TEXT,
  toss_customer_key     TEXT,
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.usage_records (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID    NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type      TEXT    NOT NULL CHECK (type IN ('seteok', 'report')),
  month     TEXT    NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, type, month)
);

CREATE TABLE IF NOT EXISTS public.usage_credits (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('seteok', 'report')),
  amount     INTEGER     NOT NULL CHECK (amount > 0),
  reason     TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referee_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ,
  credits_granted BOOLEAN     DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referee_id)
);

-- ============================================================
-- STEP 2: 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email              ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code      ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id    ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_month ON public.usage_records(user_id, month);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_type  ON public.usage_records(user_id, type, month);
CREATE INDEX IF NOT EXISTS idx_usage_credits_user_type  ON public.usage_credits(user_id, type);
CREATE INDEX IF NOT EXISTS idx_usage_credits_expires    ON public.usage_credits(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_history_user_created     ON public.seteok_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_subject     ON public.seteok_history(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer       ON public.referrals(referrer_id);

-- ============================================================
-- STEP 3: RLS 활성화
-- ============================================================

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_credits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seteok_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals      ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_self" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- subscriptions
CREATE POLICY "subscriptions_select_self" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- usage_records
CREATE POLICY "usage_records_select_self" ON public.usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- usage_credits
CREATE POLICY "usage_credits_select_self" ON public.usage_credits
  FOR SELECT USING (auth.uid() = user_id);

-- seteok_history
CREATE POLICY "seteok_history_all_self" ON public.seteok_history
  FOR ALL USING (auth.uid() = user_id);

-- referrals
CREATE POLICY "referrals_select_self" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- ============================================================
-- STEP 4: RPC 함수 및 트리거
-- ============================================================

-- increment_usage: 사용량 upsert
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_type    TEXT,
  p_month   TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.usage_records (user_id, type, month, count)
  VALUES (p_user_id, p_type, p_month, 1)
  ON CONFLICT (user_id, type, month)
  DO UPDATE SET count = usage_records.count + 1;
END;
$$;

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- updated_at 트리거
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- referral_code 중복 방지 함수
CREATE OR REPLACE FUNCTION public.ensure_unique_referral_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  attempts INT := 0;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM public.users
    WHERE referral_code = NEW.referral_code AND id != NEW.id
  ) AND attempts < 10 LOOP
    NEW.referral_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    attempts := attempts + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_ensure_unique_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_unique_referral_code();

-- ============================================================
-- 완료! 다음을 확인하세요:
-- 1. Supabase 대시보드 → Table Editor → 6개 테이블 확인
-- 2. Authentication → Providers → Kakao 설정
-- 3. .env.local 환경변수 설정
-- ============================================================
