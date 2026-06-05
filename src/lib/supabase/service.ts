// Service role client — bypasses RLS for server-side operations
// Use ONLY in webhook handlers and background jobs, never in user-facing routes

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured — required for webhook handlers')
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
}
