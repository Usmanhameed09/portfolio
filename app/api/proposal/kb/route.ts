import { NextResponse } from "next/server"
import { addFile, deleteFile, listFiles } from "@/lib/kb"

export const runtime = "nodejs"

const MAX_BYTES = 15 * 1024 * 1024 // 15 MB

export async function GET() {
  const files = await listFiles()
  return NextResponse.json({ files })
}

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 413 })
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const saved = await addFile({
    originalName: file.name,
    buffer,
    mimeType: file.type || "application/octet-stream",
  })
  return NextResponse.json({ file: saved })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const ok = await deleteFile(id)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
