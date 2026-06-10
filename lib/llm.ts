import OpenAI, { toFile } from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"

export type LLMProvider = "openai" | "gemini"

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; mimeType: string; data: Buffer }
  // fileId: an OpenAI Files API id to reference instead of inlining the bytes.
  | { type: "pdf"; filename: string; data: Buffer; fileId?: string }

export interface GenerateInput {
  system: string
  parts: ContentPart[]
  jsonOutput?: boolean
}

export function getProvider(): LLMProvider {
  const raw = (process.env.LLM_PROVIDER || "openai").toLowerCase()
  return raw === "gemini" ? "gemini" : "openai"
}

let openaiClientRef: OpenAI | null = null

function openaiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in .env.local")
  if (!openaiClientRef) openaiClientRef = new OpenAI({ apiKey })
  return openaiClientRef
}

// Upload a PDF to the OpenAI Files API and return its file id. Reference the
// returned id in chat content as { type: "file", file: { file_id } } — no need
// to inline the bytes on every request.
export async function uploadOpenAIPdf(data: Buffer, filename: string): Promise<string> {
  const file = await toFile(data, filename || "document.pdf", { type: "application/pdf" })
  const uploaded = await openaiClient().files.create({ file, purpose: "user_data" })
  return uploaded.id
}

export async function deleteOpenAIFile(fileId: string): Promise<void> {
  try {
    await openaiClient().files.delete(fileId)
  } catch (err) {
    console.error(`[llm] failed to delete OpenAI file ${fileId}:`, (err as Error).message)
  }
}

export async function generate(input: GenerateInput): Promise<string> {
  const provider = getProvider()
  if (provider === "gemini") return generateGemini(input)
  return generateOpenAI(input)
}

async function generateOpenAI({ system, parts, jsonOutput }: GenerateInput): Promise<string> {
  const client = openaiClient()
  const model = process.env.OPENAI_MODEL || "gpt-5.4"
  // Reasoning models (gpt-5, o-series) only accept the default temperature;
  // sending a custom value errors. Lower temperature only where it's supported.
  const supportsTemperature = !/^(gpt-5|o\d)/i.test(model)

  const content = parts.map((p) => {
    if (p.type === "text") return { type: "text", text: p.text }
    if (p.type === "image") {
      return {
        type: "image_url",
        image_url: { url: `data:${p.mimeType};base64,${p.data.toString("base64")}` },
      }
    }
    // Prefer a pre-uploaded Files API id; fall back to inline bytes only if the
    // upload wasn't done (e.g. it failed and we still want a best-effort send).
    if (p.fileId) {
      return { type: "file", file: { file_id: p.fileId } }
    }
    return {
      type: "file",
      file: {
        filename: p.filename,
        file_data: `data:application/pdf;base64,${p.data.toString("base64")}`,
      },
    }
  })

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { role: "user", content: content as any },
    ],
    ...(supportsTemperature ? { temperature: 0.3 } : {}),
    ...(jsonOutput ? { response_format: { type: "json_object" as const } } : {}),
  })
  const text = completion.choices[0]?.message?.content?.trim()
  if (!text) throw new Error("OpenAI returned an empty response")
  return text
}

async function generateGemini({ system, parts, jsonOutput }: GenerateInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set in .env.local")
  const client = new GoogleGenerativeAI(apiKey)
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro"
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: system,
    generationConfig: {
      temperature: 0.3,
      ...(jsonOutput ? { responseMimeType: "application/json" } : {}),
    },
  })

  const geminiParts = parts.map((p) => {
    if (p.type === "text") return { text: p.text }
    if (p.type === "image") {
      return { inlineData: { mimeType: p.mimeType, data: p.data.toString("base64") } }
    }
    return {
      inlineData: { mimeType: "application/pdf", data: p.data.toString("base64") },
    }
  })

  const result = await model.generateContent({
    contents: [{ role: "user", parts: geminiParts }],
  })
  const text = result.response.text().trim()
  if (!text) throw new Error("Gemini returned an empty response")
  return text
}
