import { randomUUID } from "node:crypto"
import { getStorage } from "./storage"

export interface SavedLink {
  id: string
  title: string
  url: string
  description?: string
  selected: boolean
  createdAt: string
}

interface Manifest {
  links: SavedLink[]
}

const KEY = "links.json"

async function readManifest(): Promise<Manifest> {
  const raw = await getStorage().readJson<Manifest>(KEY, { links: [] })
  return { links: raw.links || [] }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await getStorage().writeJson(KEY, manifest)
}

export async function listLinks(): Promise<SavedLink[]> {
  const m = await readManifest()
  return m.links
}

export async function addLink(input: {
  title: string
  url: string
  description?: string
}): Promise<SavedLink> {
  const m = await readManifest()
  const link: SavedLink = {
    id: randomUUID(),
    title: input.title.trim(),
    url: input.url.trim(),
    description: input.description?.trim() || undefined,
    selected: true,
    createdAt: new Date().toISOString(),
  }
  m.links.push(link)
  await writeManifest(m)
  return link
}

export async function deleteLink(id: string): Promise<boolean> {
  const m = await readManifest()
  const idx = m.links.findIndex((l) => l.id === id)
  if (idx === -1) return false
  m.links.splice(idx, 1)
  await writeManifest(m)
  return true
}

export async function setLinkSelected(id: string, selected: boolean): Promise<SavedLink | null> {
  const m = await readManifest()
  const link = m.links.find((l) => l.id === id)
  if (!link) return null
  link.selected = selected
  await writeManifest(m)
  return link
}

export async function listSelectedLinks(): Promise<SavedLink[]> {
  const m = await readManifest()
  return m.links.filter((l) => l.selected)
}
