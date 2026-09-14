import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// service role 키로 RLS를 우회하는 관리자 전용 클라이언트.
// 반드시 admin 권한을 확인한 서버 액션 안에서만 사용할 것 — 절대 클라이언트에 노출 금지.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
