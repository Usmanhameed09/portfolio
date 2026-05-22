import { NextResponse } from "next/server"
import { generate, getProvider, type ContentPart } from "@/lib/llm"
import { classifyBuffer, readSelectedItems } from "@/lib/kb"
import { listSelectedLinks } from "@/lib/links"
import { SITE_KNOWLEDGE } from "@/lib/site-knowledge"

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

async function fileFromForm(file: File): Promise<ContentPart | null> {
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
  if (item.kind === "pdf") return { type: "pdf", filename: item.name, data: item.buffer }
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
  const includeSiteKnowledge = String(form.get("includeSiteKnowledge") || "true") !== "false"

  const clientFiles = form.getAll("clientFiles").filter((v): v is File => v instanceof File)
  const extraFiles = form.getAll("extraFiles").filter((v): v is File => v instanceof File)

  const parts: ContentPart[] = []

  if (includeSiteKnowledge) {
    parts.push({
      type: "text",
      text: "=== PORTFOLIO WEBSITE KNOWLEDGE ===\n" + SITE_KNOWLEDGE,
    })
  }

  const items = await readSelectedItems()
  console.log(
    `[generate] loaded ${items.length} selected KB items:`,
    items.map((i) => `${i.name}(${i.kind})`),
  )
  if (items.length > 0) {
    parts.push({
      type: "text",
      text: "=== UPLOADED PORTFOLIO KNOWLEDGE — treat the contents below as authoritative portfolio facts the proposal must draw from ===",
    })
    for (const item of items) {
      if (item.kind === "pdf") {
        parts.push({ type: "text", text: `--- PDF (raw, no extractable text): ${item.name} ---` })
        parts.push({ type: "pdf", filename: item.name, data: item.buffer })
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
        "=== RELEVANT LINKS (weave naturally into the proposal where they strengthen a claim) ===\n" +
        lines.join("\n"),
    })
  }

  parts.push({ type: "text", text: "=== UPWORK JOB DESCRIPTION ===\n" + jobDescription })

  if (jobQuestions) {
    parts.push({
      type: "text",
      text:
        "=== JOB QUESTIONS — answer each SEPARATELY in the JSON 'answers' array, NOT in the proposal body ===\n" +
        jobQuestions,
    })
  }

  if (clientDocs || clientFiles.length > 0) {
    parts.push({ type: "text", text: "=== CLIENT-ATTACHED DOCS ===" })
    if (clientDocs) parts.push({ type: "text", text: clientDocs })
    try {
      for (const f of clientFiles) {
        const part = await fileFromForm(f)
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
        const part = await fileFromForm(f)
        if (part) {
          parts.push({ type: "text", text: `--- ${f.name} ---` })
          parts.push(part)
        }
      }
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
  }

  parts.push({
    type: "text",
    text:
      "Using all of the above (text + attached files), write the Upwork proposal now, following the system prompt rules exactly. Remember: respond as JSON per the schema.",
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

    return NextResponse.json({ proposal, answers, provider: getProvider() })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
