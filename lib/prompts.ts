import { randomUUID } from "node:crypto"
import { getStorage } from "./storage"

export interface SavedPrompt {
  id: string
  name: string
  content: string
  updatedAt: string
}

interface Manifest {
  prompts: SavedPrompt[]
}

const KEY = "prompts.json"

async function readManifest(): Promise<Manifest> {
  const raw = await getStorage().readJson<Manifest>(KEY, { prompts: [] })
  return { prompts: raw.prompts || [] }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await getStorage().writeJson(KEY, manifest)
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
