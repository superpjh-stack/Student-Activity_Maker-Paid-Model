-- ============================================================
-- 003_enable_rls.sql
-- Row Level Security 설정
-- 주의: 앱 코드는 service_role(createAdminClient)을 사용하므로
--       RLS는 직접 DB 접근 및 anon 클라이언트 보호용입니다
-- ============================================================

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 자신의 행만 조회/수정 (anon 클라이언트)
CREATE POLICY "users_select_self" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- INSERT/DELETE: service_role만 허용 (정책 없음 = service_role만 가능)

-- ------------------------------------------------------------
-- subscriptions
-- ------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 자신의 구독만 조회 (anon 클라이언트)
CREATE POLICY "subscriptions_select_self" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE: service_role만 허용

-- ------------------------------------------------------------
-- usage_records
-- ------------------------------------------------------------
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_records_select_self" ON public.usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- usage_credits
-- ------------------------------------------------------------
ALTER TABLE public.usage_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_credits_select_self" ON public.usage_credits
  FOR SELECT USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- seteok_history
-- ------------------------------------------------------------
ALTER TABLE public.seteok_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seteok_history_all_self" ON public.seteok_history
  FOR ALL USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- referrals
-- ------------------------------------------------------------
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 자신이 추천인이거나 피추천인인 행만 조회
CREATE POLICY "referrals_select_self" ON public.referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referee_id
  );
