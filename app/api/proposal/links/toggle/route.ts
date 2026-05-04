import { NextResponse } from "next/server"
import { setLinkSelected } from "@/lib/links"

export const runtime = "nodejs"

export async function PATCH(req: Request) {
  let body: { id?: string; selected?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!body.id || typeof body.selected !== "boolean") {
    return NextResponse.json({ error: "Missing id or selected" }, { status: 400 })
  }
  const link = await setLinkSelected(body.id, body.selected)
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ link })
}
