import path from "node:path"
import { randomUUID } from "node:crypto"
import mammoth from "mammoth"
import { getStorage } from "./storage"

export interface KbFile {
  id: string
  originalName: string
  ref: string
  mimeType: string
  size: number
  uploadedAt: string
  selected: boolean
  excerpt?: string
}

export type SelectedItem =
  | { kind: "pdf"; name: string; buffer: Buffer }
  | { kind: "image"; name: string; mimeType: string; buffer: Buffer }
  | { kind: "text"; name: string; text: string }

interface Manifest {
  files: KbFile[]
}

const MANIFEST_KEY = "manifest.json"

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"])
const TEXT_EXTS = new Set([".txt", ".md"])

async function readManifest(): Promise<Manifest> {
  const raw = await getStorage().readJson<Manifest>(MANIFEST_KEY, { files: [] })
  return { files: raw.files || [] }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await getStorage().writeJson(MANIFEST_KEY, manifest)
}

export async function listFiles(): Promise<KbFile[]> {
  const m = await readManifest()
  return m.files
}

export async function addFile(input: {
  originalName: string
  buffer: Buffer
  mimeType: string
}): Promise<KbFile> {
  const storage = getStorage()
  const ref = await storage.putFile(input.originalName, input.buffer, input.mimeType)

  const ext = path.extname(input.originalName).toLowerCase()
  const excerpt = isBinaryByExt(ext)
    ? ""
    : (await safeExtractText(input.buffer, input.mimeType, input.originalName)).slice(0, 300)

  const manifest = await readManifest()
  const file: KbFile = {
    id: randomUUID(),
    originalName: input.originalName,
    ref,
    mimeType: input.mimeType,
    size: input.buffer.length,
    uploadedAt: new Date().toISOString(),
    selected: true,
    excerpt,
  }
  manifest.files.push(file)
  await writeManifest(manifest)
  return file
}

export async function deleteFile(id: string): Promise<boolean> {
  const manifest = await readManifest()
  const idx = manifest.files.findIndex((f) => f.id === id)
  if (idx === -1) return false
  const [removed] = manifest.files.splice(idx, 1)
  await getStorage().deleteFile(removed.ref)
  await writeManifest(manifest)
  return true
}

export async function setSelected(id: string, selected: boolean): Promise<KbFile | null> {
  const manifest = await readManifest()
  const file = manifest.files.find((f) => f.id === id)
  if (!file) return null
  file.selected = selected
  await writeManifest(manifest)
  return file
}

export async function readSelectedItems(): Promise<SelectedItem[]> {
  const manifest = await readManifest()
  const selected = manifest.files.filter((f) => f.selected)
  const storage = getStorage()
  const out: SelectedItem[] = []
  for (const f of selected) {
    try {
      const buf = await storage.getFile(f.ref)
      out.push(await classifyBuffer({ name: f.originalName, mimeType: f.mimeType, buffer: buf }))
    } catch (err) {
      out.push({
        kind: "text",
        name: f.originalName,
        text: `[Could not read file: ${(err as Error).message}]`,
      })
    }
  }
  return out
}

export async function classifyBuffer(input: {
  name: string
  mimeType: string
  buffer: Buffer
}): Promise<SelectedItem> {
  const ext = path.extname(input.name).toLowerCase()
  if (ext === ".pdf" || input.mimeType === "application/pdf") {
    return { kind: "pdf", name: input.name, buffer: input.buffer }
  }
  if (IMAGE_EXTS.has(ext) || input.mimeType.startsWith("image/")) {
    return {
      kind: "image",
      name: input.name,
      mimeType: normalizeImageMime(input.mimeType, ext),
      buffer: input.buffer,
    }
  }
  if (
    ext === ".docx" ||
    input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer: input.buffer })
      return { kind: "text", name: input.name, text: result.value || "" }
    } catch (err) {
      return {
        kind: "text",
        name: input.name,
        text: `[Failed to read DOCX: ${(err as Error).message}]`,
      }
    }
  }
  if (TEXT_EXTS.has(ext) || input.mimeType.startsWith("text/")) {
    return { kind: "text", name: input.name, text: input.buffer.toString("utf8") }
  }
  return { kind: "text", name: input.name, text: input.buffer.toString("utf8") }
}

function isBinaryByExt(ext: string): boolean {
  return ext === ".pdf" || IMAGE_EXTS.has(ext)
}

function normalizeImageMime(mime: string, ext: string): string {
  if (mime && mime.startsWith("image/")) return mime
  if (ext === ".png") return "image/png"
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".webp") return "image/webp"
  if (ext === ".gif") return "image/gif"
  return "application/octet-stream"
}

async function safeExtractText(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase()
  try {
    if (ext === ".pdf" || mimeType === "application/pdf") {
      const { PDFParse } = await import("pdf-parse")
      const data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      const parser = new PDFParse({ data })
      try {
        const result = await parser.getText()
        return result.text || ""
      } finally {
        await parser.destroy().catch(() => {})
      }
    }
    if (
      ext === ".docx" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer })
      return result.value || ""
    }
    if (TEXT_EXTS.has(ext) || mimeType.startsWith("text/")) {
      return buffer.toString("utf8")
    }
    return ""
  } catch {
    return ""
  }
}
