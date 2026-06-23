import { NextResponse } from "next/server"
import { getActiveUser } from "@/lib/auth-guard"

export const runtime = "nodejs"

// Polled by the client to detect a ban/delete quickly. Returns 401 when the
// account is no longer active, which the client's apiFetch turns into a
// sign-out + redirect.
export async function GET() {
  const user = await getActiveUser()
  if (!user) return NextResponse.json({ active: false }, { status: 401 })
  return NextResponse.json({ active: true })
}
