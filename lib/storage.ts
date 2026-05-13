import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export interface Storage {
  readJson<T>(key: string, fallback: T): Promise<T>
  writeJson<T>(key: string, value: T): Promise<void>
  putFile(filename: string, buffer: Buffer, mimeType: string): Promise<string>
  getFile(ref: string): Promise<Buffer>
  deleteFile(ref: string): Promise<void>
}

let cached: Storage | null = null

export function getStorage(): Storage {
  if (cached) return cached
  cached = supabaseConfigured() ? createSupabaseStorage() : createLocalStorage()
  return cached
}

function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function createLocalStorage(): Storage {
  const ROOT = path.join(process.cwd(), "knowledge-base")
  const FILES_DIR = path.join(ROOT, "files")

  return {
    async readJson<T>(key: string, fallback: T): Promise<T> {
      try {
        await fs.mkdir(ROOT, { recursive: true })
        const raw = await fs.readFile(path.join(ROOT, key), "utf8")
        return JSON.parse(raw) as T
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback
        throw err
      }
    },
    async writeJson<T>(key: string, value: T): Promise<void> {
      await fs.mkdir(ROOT, { recursive: true })
      await fs.writeFile(path.join(ROOT, key), JSON.stringify(value, null, 2), "utf8")
    },
    async putFile(filename: string, buffer: Buffer): Promise<string> {
      await fs.mkdir(FILES_DIR, { recursive: true })
      const ext = path.extname(filename).toLowerCase()
      const storedName = `${randomUUID()}${ext}`
      await fs.writeFile(path.join(FILES_DIR, storedName), buffer)
      return `files/${storedName}`
    },
    async getFile(ref: string): Promise<Buffer> {
      return await fs.readFile(path.join(ROOT, ref))
    },
    async deleteFile(ref: string): Promise<void> {
      try {
        await fs.unlink(path.join(ROOT, ref))
      } catch {
        /* ignore */
      }
    },
  }
}

function createSupabaseStorage(): Storage {
  const url = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const bucket = process.env.SUPABASE_BUCKET || "proposal-gen"
  let clientRef: SupabaseClient | null = null

  function client(): SupabaseClient {
    if (!clientRef) {
      clientRef = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    }
    return clientRef
  }

  return {
    async readJson<T>(key: string, fallback: T): Promise<T> {
      const { data, error } = await client().storage.from(bucket).download(key)
      if (error || !data) return fallback
      try {
        const text = await data.text()
        return JSON.parse(text) as T
      } catch {
        return fallback
      }
    },
    async writeJson<T>(key: string, value: T): Promise<void> {
      const body = JSON.stringify(value, null, 2)
      const { error } = await client().storage.from(bucket).upload(key, body, {
        contentType: "application/json",
        upsert: true,
      })
      if (error) throw new Error(`Supabase writeJson(${key}): ${error.message}`)
    },
    async putFile(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
      const id = randomUUID()
      const ext = path.extname(filename).toLowerCase()
      const ref = `files/${id}${ext}`
      const { error } = await client().storage.from(bucket).upload(ref, buffer, {
        contentType: mimeType || "application/octet-stream",
        upsert: false,
      })
      if (error) throw new Error(`Supabase putFile: ${error.message}`)
      return ref
    },
    async getFile(ref: string): Promise<Buffer> {
      const { data, error } = await client().storage.from(bucket).download(ref)
      if (error || !data) throw new Error(`Supabase getFile(${ref}): ${error?.message ?? "no data"}`)
      return Buffer.from(await data.arrayBuffer())
    },
    async deleteFile(ref: string): Promise<void> {
      try {
        await client().storage.from(bucket).remove([ref])
      } catch {
        /* ignore */
      }
    },
  }
}
