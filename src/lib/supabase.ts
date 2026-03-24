import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 브라우저/서버 공용 클라이언트 (anon key — RLS 적용)
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 서버 전용 관리자 클라이언트 (service role key — RLS 우회)
// API Route, Server Action 에서만 사용
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
