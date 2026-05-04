import { NextResponse } from "next/server"
import { AUTH_COOKIE, SESSION_TOKEN, verifyPassword } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!verifyPassword(body.password || "")) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 })
  return res
}
