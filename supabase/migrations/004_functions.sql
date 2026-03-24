-- ============================================================
-- 004_functions.sql
-- RPC 함수 및 트리거
-- ============================================================

-- ------------------------------------------------------------
-- increment_usage: usage_records upsert
-- 없으면 count=1로 생성, 있으면 +1
-- src/lib/usage.ts의 incrementUsage()에서 호출
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_type    TEXT,
  p_month   TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER   -- service_role 권한으로 실행
AS $$
BEGIN
  INSERT INTO public.usage_records (user_id, type, month, count)
  VALUES (p_user_id, p_type, p_month, 1)
  ON CONFLICT (user_id, type, month)
  DO UPDATE SET count = usage_records.count + 1;
END;
$$;

-- ------------------------------------------------------------
-- updated_at 자동 갱신 트리거 함수
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- users updated_at 트리거
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- subscriptions updated_at 트리거
CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- ensure_referral_code: referral_code 중복 시 재생성
-- (랜덤 6자리라 극히 드문 충돌 방어)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_unique_referral_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM public.users
    WHERE referral_code = NEW.referral_code AND id != NEW.id
  ) AND attempts < 10 LOOP
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    NEW.referral_code := new_code;
    attempts := attempts + 1;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_ensure_unique_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.ensure_unique_referral_code();
