import { timingSafeEqual } from "node:crypto"
import { SESSION_TOKEN } from "./auth-shared"
import { env } from "node:process"

const PASSWORD = env.PASSWORD || ""

export function verifyPassword(input: string): boolean {
  if (typeof input !== "string" || input.length === 0) return false
  const a = Buffer.from(input)
  const b = Buffer.from(PASSWORD)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false
  if (token.length !== SESSION_TOKEN.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(SESSION_TOKEN))
}

export { SESSION_TOKEN, AUTH_COOKIE } from "./auth-shared"
