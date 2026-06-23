import { createClient } from "@/lib/supabase/client"

const LOGIN_PATH = "/proposal-generator/login"

// Plain redirect to login — no auth calls. Safe to call from inside Supabase's
// onAuthStateChange callback (calling signOut there deadlocks the auth lock).
export function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = LOGIN_PATH
  }
}

// Clears the local Supabase session and sends the user to the login page.
// Used when the server rejects us (401) or a periodic check finds the account
// is gone/banned. Do NOT call this from onAuthStateChange — use
// redirectToLogin() there instead. `scope: "local"` avoids a network round-trip
// so logout is instant and can't hang.
export async function forceSignOut() {
  try {
    await createClient().auth.signOut({ scope: "local" })
  } catch {
    // Already signed out or offline — redirect regardless.
  }
  redirectToLogin()
}

// fetch() wrapper for the proposal API. A 401 means the session is no longer
// valid (signed out, banned, or deleted in Supabase) — sign out and redirect
// instead of letting the caller process the error body.
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status === 401) {
    await forceSignOut()
    throw new Error("Your session has ended. Please sign in again.")
  }
  return res
}
