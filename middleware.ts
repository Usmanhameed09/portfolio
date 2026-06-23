import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh the session first so auth cookies stay valid; `user` is null when
  // signed out, deleted, or banned in the Supabase dashboard.
  const { supabaseResponse, user } = await updateSession(request)

  // The login page must be reachable while signed out.
  if (pathname === "/proposal-generator/login") return supabaseResponse

  if (!user) {
    if (pathname.startsWith("/api/proposal/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = "/proposal-generator/login"
    url.searchParams.set("from", pathname)
    const redirect = NextResponse.redirect(url)
    // Preserve any refreshed/cleared auth cookies on the redirect.
    supabaseResponse.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/proposal-generator/:path*", "/api/proposal/:path*"],
}
