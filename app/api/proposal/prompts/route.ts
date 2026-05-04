import { NextResponse } from "next/server"
import { deletePrompt, listPrompts, savePrompt } from "@/lib/prompts"

export const runtime = "nodejs"

export async function GET() {
  const prompts = await listPrompts()
  return NextResponse.json({ prompts })
}

export async function POST(req: Request) {
  let body: { id?: string; name?: string; content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const name = (body.name || "").trim()
  const content = (body.content || "").trim()
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (!content) return NextResponse.json({ error: "Prompt content is required" }, { status: 400 })
  const prompt = await savePrompt({ id: body.id, name, content })
  return NextResponse.json({ prompt })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const ok = await deletePrompt(id)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
