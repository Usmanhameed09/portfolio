import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { AUTH_COOKIE, SESSION_TOKEN } from "@/lib/auth-shared"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/proposal-generator/login") return NextResponse.next()
  if (pathname.startsWith("/api/proposal/auth")) return NextResponse.next()

  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (token === SESSION_TOKEN) return NextResponse.next()

  if (pathname.startsWith("/api/proposal/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = request.nextUrl.clone()
  url.pathname = "/proposal-generator/login"
  url.searchParams.set("from", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/proposal-generator/:path*", "/api/proposal/:path*"],
}
