import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env } from "@/lib/env";

// Cliente con service_role: saltea RLS. Solo en el servidor (route handlers, server components, server actions).
// Nunca importarlo desde un componente "use client".
let cached: SupabaseClient<Database> | null = null;
export function supabaseAdmin(): SupabaseClient<Database> {
  if (!cached) {
    cached = createClient<Database>(env.supabaseUrl(), env.supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
