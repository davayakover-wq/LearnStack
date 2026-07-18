import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Service-role client — bypasses RLS entirely. Reserved for the narrow set
// of writes that are deliberately blocked for regular users at the database
// level and can only be performed by the trusted server (docs/03-tech-
// stack.md: SUPABASE_SERVICE_ROLE_KEY is "used only in ... trusted server
// contexts"). Concretely: profiles.xp/level/coins/current_streak/
// longest_streak/last_activity_date are pinned back to their old value by
// the `protect_profile_privileged_columns` trigger (see migration
// 20260715000003_profiles.sql) unless `current_user = 'service_role'` —
// this client is how application logic satisfies that check. Never import
// this into anything that runs in the browser, and never use it for a
// write a Route Handler hasn't already validated server-side.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
