import { NextResponse } from "next/server"
import { getFileForDownload } from "@/lib/kb"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const file = await getFileForDownload(id)
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Encode the filename for the header (RFC 5987) so non-ASCII names survive.
  const encoded = encodeURIComponent(file.originalName)
  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
      "Content-Length": String(file.buffer.length),
    },
  })
}
