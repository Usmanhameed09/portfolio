import { NextResponse } from "next/server"
import {
  generate,
  getProvider,
  uploadOpenAIPdf,
  deleteOpenAIFile,
  type ContentPart,
} from "@/lib/llm"
import { classifyBuffer, readSelectedItems, setOpenAIFileId } from "@/lib/kb"
import { listSelectedLinks } from "@/lib/links"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_TRANSIENT_BYTES = 15 * 1024 * 1024 // 15 MB per uploaded file

const OUTPUT_FORMAT_INSTRUCTION = `

OUTPUT FORMAT — Respond with ONLY valid JSON. No markdown, no preamble, no commentary outside JSON.
Schema:
{
  "proposal": "<the full proposal text, following all rules above>",
  "answers": [
    { "question": "<verbatim question>", "answer": "<concise direct answer>" }
  ]
}
The "proposal" field must NOT include answers to job questions — answers go ONLY in the "answers" array. If no job questions were provided, return an empty array for "answers".`

interface AnswerItem {
  question: string
  answer: string
}

async function fileFromForm(
  file: File,
  resolveFileId?: (data: Buffer, filename: string) => Promise<string | undefined>,
): Promise<ContentPart | null> {
  if (!file.name) return null
  if (file.size === 0) return null
  if (file.size > MAX_TRANSIENT_BYTES) {
    throw new Error(`File too large: ${file.name} (max 15MB)`)
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const item = await classifyBuffer({
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    buffer,
  })
  if (item.kind === "pdf") {
    const fileId = await resolveFileId?.(item.buffer, item.name)
    return { type: "pdf", filename: item.name, data: item.buffer, fileId }
  }
  if (item.kind === "image")
    return { type: "image", mimeType: item.mimeType, data: item.buffer }
  return { type: "text", text: `--- ${item.name} ---\n${item.text}` }
}

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const systemPrompt = String(form.get("systemPrompt") || "").trim()
  if (!systemPrompt) {
    return NextResponse.json({ error: "Proposal-making prompt is required" }, { status: 400 })
  }
  const jobDescription = String(form.get("jobDescription") || "").trim()
  if (!jobDescription) {
    return NextResponse.json({ error: "Job description is required" }, { status: 400 })
  }
  const jobQuestions = String(form.get("jobQuestions") || "").trim()
  const clientDocs = String(form.get("clientDocs") || "").trim()
  const extraContext = String(form.get("extraContext") || "").trim()

  const clientFiles = form.getAll("clientFiles").filter((v): v is File => v instanceof File)
  const extraFiles = form.getAll("extraFiles").filter((v): v is File => v instanceof File)

  const parts: ContentPart[] = []
  const provider = getProvider()
  // OpenAI Files API ids for transient (per-request) uploads, deleted after use.
  const transientOpenAIFiles: string[] = []

  // Resolve a PDF to an OpenAI file id when on OpenAI: reuse the cached id for
  // KB files (persisting it), upload transient files fresh. Falls back to
  // inlining the bytes if upload fails.
  async function resolvePdfFileId(
    data: Buffer,
    filename: string,
    cache?: { kbId?: string; existing?: string },
  ): Promise<string | undefined> {
    if (provider !== "openai") return undefined
    if (cache?.existing) return cache.existing
    try {
      const fileId = await uploadOpenAIPdf(data, filename)
      if (cache?.kbId) await setOpenAIFileId(cache.kbId, fileId)
      else transientOpenAIFiles.push(fileId)
      return fileId
    } catch (err) {
      console.error(`[generate] OpenAI upload failed for ${filename}:`, (err as Error).message)
      return undefined
    }
  }

  const items = await readSelectedItems()
  console.log(
    `[generate] loaded ${items.length} selected KB items:`,
    items.map((i) => `${i.name}(${i.kind})`),
  )
  if (items.length > 0) {
    parts.push({
      type: "text",
      text: "=== MY PORTFOLIO (uploaded files) ===",
    })
    for (const item of items) {
      if (item.kind === "pdf") {
        parts.push({
          type: "text",
          text: `--- PDF: ${item.name} (read this whole document directly — text and images — it is part of my portfolio) ---`,
        })
        const fileId = await resolvePdfFileId(item.buffer, item.name, {
          kbId: item.kbId,
          existing: item.openaiFileId,
        })
        parts.push({ type: "pdf", filename: item.name, data: item.buffer, fileId })
      } else if (item.kind === "image") {
        parts.push({ type: "text", text: `--- IMAGE: ${item.name} ---` })
        parts.push({ type: "image", mimeType: item.mimeType, data: item.buffer })
      } else {
        parts.push({
          type: "text",
          text: `--- ${item.name} (portfolio content) ---\n${item.text}`,
        })
      }
    }
  }

  const selectedLinks = await listSelectedLinks()
  if (selectedLinks.length > 0) {
    const lines = selectedLinks.map((l) => {
      const desc = l.description ? ` — ${l.description}` : ""
      return `- ${l.title}: ${l.url}${desc}`
    })
    parts.push({
      type: "text",
      text:
        "=== MY LINKS (use these exactly as written; never invent URLs) ===\n" +
        lines.join("\n"),
    })
  }

  if (clientDocs || clientFiles.length > 0) {
    parts.push({ type: "text", text: "=== CLIENT-ATTACHED DOCS ===" })
    if (clientDocs) parts.push({ type: "text", text: clientDocs })
    try {
      for (const f of clientFiles) {
        const part = await fileFromForm(f, resolvePdfFileId)
        if (part) {
          parts.push({ type: "text", text: `--- ${f.name} ---` })
          parts.push(part)
        }
      }
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
  }

  if (extraContext || extraFiles.length > 0) {
    parts.push({ type: "text", text: "=== ADDITIONAL CONTEXT ===" })
    if (extraContext) parts.push({ type: "text", text: extraContext })
    try {
      for (const f of extraFiles) {
        const part = await fileFromForm(f, resolvePdfFileId)
        if (part) {
          parts.push({ type: "text", text: `--- ${f.name} ---` })
          parts.push(part)
        }
      }
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
  }

  // Job description + questions go LAST so they are the freshest context for
  // the model — placing them after the (often large) portfolio avoids the
  // "lost in the middle" effect where the actual task gets skimmed.
  parts.push({ type: "text", text: "=== UPWORK JOB DESCRIPTION (this is the job you are applying to — read it carefully and in full) ===\n" + jobDescription })

  if (jobQuestions) {
    parts.push({
      type: "text",
      text:
        "=== JOB QUESTIONS — answer each SEPARATELY in the JSON 'answers' array, NOT in the proposal body ===\n" +
        jobQuestions,
    })
  }

  parts.push({
    type: "text",
    text:
      "TASK: Write the Upwork proposal now, following the system prompt.\n" +
      "Before writing, silently extract EVERY distinct requirement, skill, technology, deliverable, and question stated in the UPWORK JOB DESCRIPTION above. " +
      "Your proposal must explicitly address each one — do not skip or gloss over any point the client raised. " +
      "Ground your claims in MY PORTFOLIO and attached files; never invent experience or URLs. " +
      "Respond as JSON per the schema.",
  })

  try {
    const raw = await generate({
      system: systemPrompt + OUTPUT_FORMAT_INSTRUCTION,
      parts,
      jsonOutput: true,
    })

    let proposal = ""
    let answers: AnswerItem[] = []
    try {
      const parsed = JSON.parse(raw) as { proposal?: string; answers?: AnswerItem[] }
      proposal = (parsed.proposal || "").trim()
      if (Array.isArray(parsed.answers)) {
        answers = parsed.answers
          .filter((a) => a && typeof a.question === "string" && typeof a.answer === "string")
          .map((a) => ({ question: a.question.trim(), answer: a.answer.trim() }))
      }
    } catch {
      proposal = raw.trim()
    }

    if (!proposal) proposal = raw.trim()

    return NextResponse.json({ proposal, answers, provider })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  } finally {
    // Clean up per-request uploads so they don't accumulate in the OpenAI account.
    // KB file ids are cached and intentionally kept for reuse.
    for (const id of transientOpenAIFiles) await deleteOpenAIFile(id)
  }
}
