-- ============================================================
-- 005_seed_test.sql
-- 개발/테스트용 시드 데이터 (프로덕션에는 실행 금지)
-- ============================================================

-- 테스트 사용자 (실제 Kakao 로그인 없이 DB 구조 확인용)
-- 실제 서비스에서는 NextAuth signIn 콜백이 자동으로 생성합니다

/*
INSERT INTO public.users (id, email, name, grade)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  '테스트 학생',
  2
);

INSERT INTO public.subscriptions (user_id, plan, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'free',
  'active'
);
*/

-- 위 주석을 해제하면 테스트 데이터가 삽입됩니다.
-- 테스트 후 반드시 삭제하세요:
-- DELETE FROM public.users WHERE email = 'test@example.com';
