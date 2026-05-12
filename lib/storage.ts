import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { put, del, list } from "@vercel/blob"

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
  cached = process.env.BLOB_READ_WRITE_TOKEN ? createBlobStorage() : createLocalStorage()
  return cached
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

function createBlobStorage(): Storage {
  const PREFIX = "proposal-gen/"

  return {
    async readJson<T>(key: string, fallback: T): Promise<T> {
      const pathname = PREFIX + key
      try {
        const { blobs } = await list({ prefix: pathname, limit: 10 })
        const match = blobs.find((b) => b.pathname === pathname)
        if (!match) return fallback
        const res = await fetch(match.url, { cache: "no-store" })
        if (!res.ok) return fallback
        return (await res.json()) as T
      } catch {
        return fallback
      }
    },
    async writeJson<T>(key: string, value: T): Promise<void> {
      await put(PREFIX + key, JSON.stringify(value, null, 2), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      })
    },
    async putFile(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
      const id = randomUUID()
      const ext = path.extname(filename).toLowerCase()
      const pathname = `${PREFIX}files/${id}${ext}`
      const result = await put(pathname, buffer, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: mimeType || "application/octet-stream",
      })
      return result.url
    },
    async getFile(ref: string): Promise<Buffer> {
      const res = await fetch(ref, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to fetch blob (${res.status})`)
      return Buffer.from(await res.arrayBuffer())
    },
    async deleteFile(ref: string): Promise<void> {
      try {
        await del(ref)
      } catch {
        /* ignore */
      }
    },
  }
}
