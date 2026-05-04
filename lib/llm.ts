import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"

export type LLMProvider = "openai" | "gemini"

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; mimeType: string; data: Buffer }
  | { type: "pdf"; filename: string; data: Buffer }

export interface GenerateInput {
  system: string
  parts: ContentPart[]
  jsonOutput?: boolean
}

export function getProvider(): LLMProvider {
  const raw = (process.env.LLM_PROVIDER || "openai").toLowerCase()
  return raw === "gemini" ? "gemini" : "openai"
}

export async function generate(input: GenerateInput): Promise<string> {
  const provider = getProvider()
  if (provider === "gemini") return generateGemini(input)
  return generateOpenAI(input)
}

async function generateOpenAI({ system, parts, jsonOutput }: GenerateInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in .env.local")
  const client = new OpenAI({ apiKey })
  const model = process.env.OPENAI_MODEL || "gpt-4o"

  const content = parts.map((p) => {
    if (p.type === "text") return { type: "text", text: p.text }
    if (p.type === "image") {
      return {
        type: "image_url",
        image_url: { url: `data:${p.mimeType};base64,${p.data.toString("base64")}` },
      }
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
    temperature: 0.7,
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
    ...(jsonOutput
      ? { generationConfig: { responseMimeType: "application/json" } }
      : {}),
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
