-- ============================================================
-- 002_create_indexes.sql
-- 성능 최적화 인덱스
-- ============================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_users_referral_code
  ON public.users(referral_code);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status
  ON public.subscriptions(plan, status);

-- usage_records: 월별 사용량 조회 (checkUsage, incrementUsage에서 빈번히 사용)
CREATE INDEX IF NOT EXISTS idx_usage_records_user_month
  ON public.usage_records(user_id, month);

CREATE INDEX IF NOT EXISTS idx_usage_records_user_type_month
  ON public.usage_records(user_id, type, month);

-- usage_credits: 만료 전 크레딧 조회
CREATE INDEX IF NOT EXISTS idx_usage_credits_user_type
  ON public.usage_credits(user_id, type);

CREATE INDEX IF NOT EXISTS idx_usage_credits_expires
  ON public.usage_credits(expires_at)
  WHERE expires_at IS NOT NULL;

-- seteok_history: 최신순 조회
CREATE INDEX IF NOT EXISTS idx_seteok_history_user_created
  ON public.seteok_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_seteok_history_user_subject
  ON public.seteok_history(user_id, subject_id);

-- referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON public.referrals(referrer_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referee
  ON public.referrals(referee_id);
