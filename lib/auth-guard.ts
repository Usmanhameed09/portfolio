import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Returns the signed-in user, or null if not authenticated OR banned.
//
// A Supabase ban does NOT revoke an already-issued access token (a stateless
// JWT valid until it expires). So validating the JWT alone keeps letting a
// banned user through for up to the token lifetime. Here we re-check the live
// ban status via the service-role admin API so a ban takes effect right away.
export async function getActiveUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  // No admin credentials configured — can't verify ban state, so allow.
  if (!url || !key) return user

  const admin = createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await admin.auth.admin.getUserById(user.id)
  if (error || !data.user) return null

  const bannedUntil = data.user.banned_until
  if (bannedUntil && new Date(bannedUntil).getTime() > Date.now()) return null

  return user
}
