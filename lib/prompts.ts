import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"

export interface SavedPrompt {
  id: string
  name: string
  content: string
  updatedAt: string
}

interface Manifest {
  prompts: SavedPrompt[]
}

const ROOT = path.join(process.cwd(), "knowledge-base")
const FILE = path.join(ROOT, "prompts.json")

async function readManifest(): Promise<Manifest> {
  await fs.mkdir(ROOT, { recursive: true })
  try {
    const raw = await fs.readFile(FILE, "utf8")
    const parsed = JSON.parse(raw) as Manifest
    return { prompts: parsed.prompts || [] }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { prompts: [] }
    throw err
  }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(manifest, null, 2), "utf8")
}

export async function listPrompts(): Promise<SavedPrompt[]> {
  const m = await readManifest()
  return m.prompts.sort((a, b) => a.name.localeCompare(b.name))
}

export async function savePrompt(input: {
  id?: string
  name: string
  content: string
}): Promise<SavedPrompt> {
  const m = await readManifest()
  const now = new Date().toISOString()
  if (input.id) {
    const existing = m.prompts.find((p) => p.id === input.id)
    if (existing) {
      existing.name = input.name
      existing.content = input.content
      existing.updatedAt = now
      await writeManifest(m)
      return existing
    }
  }
  const byName = m.prompts.find((p) => p.name === input.name)
  if (byName) {
    byName.content = input.content
    byName.updatedAt = now
    await writeManifest(m)
    return byName
  }
  const created: SavedPrompt = {
    id: randomUUID(),
    name: input.name,
    content: input.content,
    updatedAt: now,
  }
  m.prompts.push(created)
  await writeManifest(m)
  return created
}

export async function deletePrompt(id: string): Promise<boolean> {
  const m = await readManifest()
  const idx = m.prompts.findIndex((p) => p.id === id)
  if (idx === -1) return false
  m.prompts.splice(idx, 1)
  await writeManifest(m)
  return true
}
