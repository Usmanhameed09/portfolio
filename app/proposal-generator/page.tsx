"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Trash2,
  Upload,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Link as LinkIcon,
  Plus,
  Save,
  ExternalLink,
} from "lucide-react"

interface KbFile {
  id: string
  originalName: string
  mimeType: string
  size: number
  uploadedAt: string
  selected: boolean
  excerpt?: string
}

interface SavedPrompt {
  id: string
  name: string
  content: string
  updatedAt: string
}

interface SavedLink {
  id: string
  title: string
  url: string
  description?: string
  selected: boolean
  createdAt: string
}

const DEFAULT_PROMPT = `You are an expert Upwork proposal writer. Using my portfolio and the job details provided, write a tailored proposal.`

export default function ProposalGeneratorPage() {
  const [files, setFiles] = useState<KbFile[]>([])
  const [links, setLinks] = useState<SavedLink[]>([])
  const [prompts, setPrompts] = useState<SavedPrompt[]>([])
  const [activePromptId, setActivePromptId] = useState<string>("")

  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT)
  const [jobDescription, setJobDescription] = useState("")
  const [jobQuestions, setJobQuestions] = useState("")
  const [clientDocs, setClientDocs] = useState("")
  const [extraContext, setExtraContext] = useState("")
  const [proposal, setProposal] = useState("")
  const [answers, setAnswers] = useState<Array<{ question: string; answer: string }>>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedAnswerIdx, setCopiedAnswerIdx] = useState<number | null>(null)

  const [clientFiles, setClientFiles] = useState<File[]>([])
  const [extraFiles, setExtraFiles] = useState<File[]>([])

  const [newLinkTitle, setNewLinkTitle] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [addingLink, setAddingLink] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const clientFileInputRef = useRef<HTMLInputElement>(null)
  const extraFileInputRef = useRef<HTMLInputElement>(null)

  async function loadAll() {
    try {
      const [kbRes, linksRes, promptsRes] = await Promise.all([
        fetch("/api/proposal/kb"),
        fetch("/api/proposal/links"),
        fetch("/api/proposal/prompts"),
      ])
      if (kbRes.ok) setFiles((await kbRes.json()).files || [])
      if (linksRes.ok) setLinks((await linksRes.json()).links || [])
      if (promptsRes.ok) setPrompts((await promptsRes.json()).prompts || [])
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    setError(null)
    try {
      for (const f of Array.from(fileList)) {
        const fd = new FormData()
        fd.append("file", f)
        const res = await fetch("/api/proposal/kb", { method: "POST", body: fd })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Upload failed for ${f.name}`)
        }
      }
      const res = await fetch("/api/proposal/kb")
      setFiles((await res.json()).files || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function onToggleFile(id: string, selected: boolean) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, selected } : f)))
    try {
      const res = await fetch("/api/proposal/kb/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, selected }),
      })
      if (!res.ok) throw new Error("Failed to update selection")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function onDeleteFile(id: string) {
    if (!confirm("Delete this file from the knowledge base?")) return
    try {
      const res = await fetch(`/api/proposal/kb?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      setFiles((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function onAddLink() {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return
    setAddingLink(true)
    setError(null)
    try {
      const res = await fetch("/api/proposal/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newLinkTitle.trim(), url: newLinkUrl.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to add link")
      }
      const { link } = await res.json()
      setLinks((prev) => [...prev, link])
      setNewLinkTitle("")
      setNewLinkUrl("")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setAddingLink(false)
    }
  }

  async function onToggleLink(id: string, selected: boolean) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, selected } : l)))
    try {
      const res = await fetch("/api/proposal/links/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, selected }),
      })
      if (!res.ok) throw new Error("Failed to update link")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function onDeleteLink(id: string) {
    if (!confirm("Delete this link?")) return
    try {
      const res = await fetch(`/api/proposal/links?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete link")
      setLinks((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function onLoadPrompt(id: string) {
    setActivePromptId(id)
    const p = prompts.find((x) => x.id === id)
    if (p) setSystemPrompt(p.content)
  }

  async function onSavePrompt() {
    const existing = prompts.find((p) => p.id === activePromptId)
    const defaultName = existing?.name || ""
    const name = window.prompt("Save prompt as:", defaultName)
    if (!name?.trim()) return
    try {
      const res = await fetch("/api/proposal/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existing && existing.name === name.trim() ? existing.id : undefined,
          name: name.trim(),
          content: systemPrompt,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save prompt")
      }
      const { prompt: saved } = await res.json()
      setPrompts((prev) => {
        const filtered = prev.filter((p) => p.id !== saved.id)
        return [...filtered, saved].sort((a, b) => a.name.localeCompare(b.name))
      })
      setActivePromptId(saved.id)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function onDeletePrompt() {
    const existing = prompts.find((p) => p.id === activePromptId)
    if (!existing) return
    if (!confirm(`Delete saved prompt "${existing.name}"?`)) return
    try {
      const res = await fetch(`/api/proposal/prompts?id=${encodeURIComponent(existing.id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete prompt")
      setPrompts((prev) => prev.filter((p) => p.id !== existing.id))
      setActivePromptId("")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function onGenerate() {
    setGenerating(true)
    setError(null)
    setProposal("")
    setAnswers([])
    try {
      const fd = new FormData()
      fd.append("systemPrompt", systemPrompt)
      fd.append("jobDescription", jobDescription)
      fd.append("jobQuestions", jobQuestions)
      fd.append("clientDocs", clientDocs)
      fd.append("extraContext", extraContext)
      for (const f of clientFiles) fd.append("clientFiles", f)
      for (const f of extraFiles) fd.append("extraFiles", f)

      const res = await fetch("/api/proposal/generate", { method: "POST", body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Generation failed")
      }
      const data = await res.json()
      setProposal(data.proposal || "")
      setAnswers(Array.isArray(data.answers) ? data.answers : [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  function onPickClientFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list) return
    setClientFiles((prev) => [...prev, ...Array.from(list)])
    if (clientFileInputRef.current) clientFileInputRef.current.value = ""
  }

  function onPickExtraFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list) return
    setExtraFiles((prev) => [...prev, ...Array.from(list)])
    if (extraFileInputRef.current) extraFileInputRef.current.value = ""
  }

  function removeClientFile(idx: number) {
    setClientFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  function removeExtraFile(idx: number) {
    setExtraFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateAnswer(idx: number, value: string) {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? { ...a, answer: value } : a)))
  }

  async function copyAnswer(idx: number) {
    const a = answers[idx]
    if (!a) return
    await navigator.clipboard.writeText(a.answer)
    setCopiedAnswerIdx(idx)
    setTimeout(() => setCopiedAnswerIdx(null), 1500)
  }

  async function onCopy() {
    if (!proposal) return
    await navigator.clipboard.writeText(proposal)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function onLogout() {
    await fetch("/api/proposal/auth", { method: "DELETE" })
    window.location.href = "/proposal-generator/login"
  }

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Upwork Proposal Generator
            </h1>
            <p className="text-muted-foreground">
              Pull from your portfolio knowledge, layer the job context, and generate a tailored proposal.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Knowledge Base</CardTitle>
                <CardDescription>
                  Upload your portfolio (PDF, docs, images) and toggle which files to include.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Uploaded files</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif"
                      className="hidden"
                      onChange={onUpload}
                    />
                  </div>

                  {files.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No files yet. PDF / image (PNG/JPG/WEBP/GIF) sent as-is. DOCX / TXT / MD sent as text.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {files.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-start gap-2 p-2 rounded-md border border-border bg-background"
                        >
                          <Checkbox
                            className="mt-1"
                            checked={f.selected}
                            onCheckedChange={(v) => onToggleFile(f.id, v === true)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-medium truncate">
                              <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              <span className="truncate">{f.originalName}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {(f.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <button
                            onClick={() => onDeleteFile(f.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Links</CardTitle>
                <CardDescription>
                  Save app demos, videos, case studies. Checked links are woven into the proposal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Title (e.g. HR Bot Loom walkthrough)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://…"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onAddLink()
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onAddLink}
                      disabled={addingLink || !newLinkTitle.trim() || !newLinkUrl.trim()}
                    >
                      {addingLink ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {links.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No links yet. Add demo URLs, Loom videos, GitHub links, etc.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {links.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-start gap-2 p-2 rounded-md border border-border bg-background"
                      >
                        <Checkbox
                          className="mt-1"
                          checked={l.selected}
                          onCheckedChange={(v) => onToggleLink(l.id, v === true)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium truncate">
                            <LinkIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{l.title}</span>
                          </div>
                          <a
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                          >
                            <span className="truncate">{l.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                        <button
                          onClick={() => onDeleteLink(l.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inputs</CardTitle>
                <CardDescription>Fill in what you have. Empty fields are skipped.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="prompt" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="prompt">Prompt</TabsTrigger>
                    <TabsTrigger value="job">Job</TabsTrigger>
                    <TabsTrigger value="client">Client docs</TabsTrigger>
                    <TabsTrigger value="extra">Extra</TabsTrigger>
                  </TabsList>

                  <TabsContent value="prompt" className="space-y-3 mt-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label className="text-sm shrink-0">Saved prompts:</Label>
                      <div className="flex-1 min-w-[180px]">
                        <Select value={activePromptId} onValueChange={onLoadPrompt}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={prompts.length === 0 ? "No saved prompts yet" : "Load a saved prompt…"} />
                          </SelectTrigger>
                          <SelectContent>
                            {prompts.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" variant="outline" onClick={onSavePrompt}>
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </Button>
                      {activePromptId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onDeletePrompt}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : null}
                    </div>
                    <Label htmlFor="prompt">Proposal-making system prompt</Label>
                    <Textarea
                      id="prompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={14}
                      className="font-mono text-xs"
                    />
                  </TabsContent>

                  <TabsContent value="job" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-desc">Job description</Label>
                      <Textarea
                        id="job-desc"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={10}
                        placeholder="Paste the Upwork job description here…"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job-q">Job questions (paste each on its own line)</Label>
                      <Textarea
                        id="job-q"
                        value={jobQuestions}
                        onChange={(e) => setJobQuestions(e.target.value)}
                        rows={5}
                        placeholder={"1. Have you built X before?\n2. What is your timeline?"}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="client" className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="client">Client-attached docs</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clientFileInputRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload files
                      </Button>
                      <input
                        ref={clientFileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif"
                        className="hidden"
                        onChange={onPickClientFiles}
                      />
                    </div>
                    {clientFiles.length > 0 ? (
                      <ul className="space-y-1.5">
                        {clientFiles.map((f, i) => (
                          <li
                            key={`${f.name}-${i}`}
                            className="flex items-center gap-2 p-2 rounded-md border border-border bg-background text-sm"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {(f.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              onClick={() => removeClientFile(i)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <Textarea
                      id="client"
                      value={clientDocs}
                      onChange={(e) => setClientDocs(e.target.value)}
                      rows={10}
                      placeholder="Paste content here, or upload files above. PDFs/images sent as-is to the model."
                    />
                  </TabsContent>

                  <TabsContent value="extra" className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="extra">Additional context</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => extraFileInputRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload files
                      </Button>
                      <input
                        ref={extraFileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.gif"
                        className="hidden"
                        onChange={onPickExtraFiles}
                      />
                    </div>
                    {extraFiles.length > 0 ? (
                      <ul className="space-y-1.5">
                        {extraFiles.map((f, i) => (
                          <li
                            key={`${f.name}-${i}`}
                            className="flex items-center gap-2 p-2 rounded-md border border-border bg-background text-sm"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {(f.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                              onClick={() => removeExtraFile(i)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <Textarea
                      id="extra"
                      value={extraContext}
                      onChange={(e) => setExtraContext(e.target.value)}
                      rows={10}
                      placeholder="Text, paste, or upload images/PDFs above."
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end mt-6">
                  <Button onClick={onGenerate} disabled={generating} size="lg">
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Proposal
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Generated proposal</CardTitle>
                    <CardDescription>Edit before sending to Upwork.</CardDescription>
                  </div>
                  {proposal ? (
                    <Button size="sm" variant="outline" onClick={onCopy}>
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  rows={16}
                  placeholder={generating ? "Working on it…" : "Your proposal will appear here."}
                />
              </CardContent>
            </Card>

            {answers.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Answers to job questions</CardTitle>
                  <CardDescription>
                    Each question answered separately. Edit and copy individually.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {answers.map((a, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <Label className="text-sm font-medium leading-snug">
                          Q{i + 1}: {a.question}
                        </Label>
                        <Button size="sm" variant="outline" onClick={() => copyAnswer(i)}>
                          {copiedAnswerIdx === i ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        value={a.answer}
                        onChange={(e) => updateAnswer(i, e.target.value)}
                        rows={4}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}
