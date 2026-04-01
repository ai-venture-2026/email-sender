import { createClient, SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any, "public", any> | null = null;

export function getSupabase() {
  if (!_supabase) {
    // Using `any` for the database type since we don't have generated types.
    // Run `npx supabase gen types` to generate proper types.
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  return _supabase;
}
