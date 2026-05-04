import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import mammoth from "mammoth"

export interface KbFile {
  id: string
  originalName: string
  storedName: string
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

const ROOT = path.join(process.cwd(), "knowledge-base")
const FILES_DIR = path.join(ROOT, "files")
const MANIFEST_PATH = path.join(ROOT, "manifest.json")

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"])
const TEXT_EXTS = new Set([".txt", ".md"])

async function ensureDirs(): Promise<void> {
  await fs.mkdir(FILES_DIR, { recursive: true })
}

async function readManifest(): Promise<Manifest> {
  await ensureDirs()
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8")
    const parsed = JSON.parse(raw) as Manifest
    if (!parsed.files) return { files: [] }
    return parsed
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { files: [] }
    throw err
  }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await ensureDirs()
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8")
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
  const id = randomUUID()
  const ext = path.extname(input.originalName).toLowerCase() || guessExt(input.mimeType)
  const storedName = `${id}${ext}`
  await ensureDirs()
  await fs.writeFile(path.join(FILES_DIR, storedName), input.buffer)

  const excerpt = isBinaryByExt(ext)
    ? ""
    : (await safeExtractText(input.buffer, input.mimeType, input.originalName)).slice(0, 300)

  const manifest = await readManifest()
  const file: KbFile = {
    id,
    originalName: input.originalName,
    storedName,
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
  try {
    await fs.unlink(path.join(FILES_DIR, removed.storedName))
  } catch {
    // ignore — file may already be gone
  }
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
  const out: SelectedItem[] = []
  for (const f of selected) {
    try {
      const buf = await fs.readFile(path.join(FILES_DIR, f.storedName))
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

function guessExt(mimeType: string): string {
  if (mimeType === "application/pdf") return ".pdf"
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return ".docx"
  if (mimeType === "image/png") return ".png"
  if (mimeType === "image/jpeg") return ".jpg"
  if (mimeType === "image/webp") return ".webp"
  if (mimeType === "image/gif") return ".gif"
  if (mimeType.startsWith("text/")) return ".txt"
  return ""
}
