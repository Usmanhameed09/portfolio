import { NextResponse } from "next/server"
import { addLink, deleteLink, listLinks } from "@/lib/links"

export const runtime = "nodejs"

export async function GET() {
  const links = await listLinks()
  return NextResponse.json({ links })
}

export async function POST(req: Request) {
  let body: { title?: string; url?: string; description?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const title = (body.title || "").trim()
  const url = (body.url || "").trim()
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 })
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }
  const link = await addLink({ title, url, description: body.description })
  return NextResponse.json({ link })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const ok = await deleteLink(id)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
