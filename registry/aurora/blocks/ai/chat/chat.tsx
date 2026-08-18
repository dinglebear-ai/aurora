"use client"

import * as React from "react"
import { AtSign, Bot, Brain, Check, CheckCheck, Command, Copy, Cpu, FileCode2, FileText, Paperclip, Pencil, RefreshCw, RotateCcw, Send, Sparkles, Square, ThumbsUp, X } from "lucide-react"

import { Snippet } from "@/registry/aurora/blocks/ai/elements/snippet"
import { Source, Sources } from "@/registry/aurora/blocks/ai/elements/sources"
import { CodeBlock } from "@/registry/aurora/blocks/workspace/code-block/code-block"
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle, AttachmentTrigger, type AttachmentState } from "@/registry/aurora/ui/attachment"
import { Bubble, BubbleContent, BubbleGroup } from "@/registry/aurora/ui/bubble"
import { Button } from "@/registry/aurora/ui/button"
import { Marker, MarkerContent, MarkerIcon } from "@/registry/aurora/ui/marker"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from "@/registry/aurora/ui/message"
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/registry/aurora/ui/message-scroller"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/aurora/ui/select"
import { Spinner } from "@/registry/aurora/ui/spinner"
import { Textarea } from "@/registry/aurora/ui/textarea"

type DemoAttachment = { id: string; title: string; description: string; state: AttachmentState }
type ShowcaseKind = "code" | "sources"
type DemoMessage = { kind: "message"; id: string; role: "assistant" | "user"; text: string; time: string; streaming?: boolean; scrollAnchor?: boolean; attachments?: DemoAttachment[]; showcase?: ShowcaseKind }
type DemoMarker = { kind: "marker"; id: string; label: string; variant?: "default" | "separator" | "border"; status?: "thinking" | "ready" | "synced" }
type DemoThreadItem = DemoMessage | DemoMarker
type Suggestion = { id: string; label: string; description: string; kind: "skill" | "file" }

const DEMO_SNIPPET = [
  "const { isAtEnd, scrollToEnd } = useMessageScroller()",
  "if (!isAtEnd) scrollToEnd({ behavior: \"smooth\" })",
].join("\n")

const DEMO_CODE = [
  "function steerConversation(input: string) {",
  "  stopActiveStream()",
  "  appendUserTurn(input)",
  "  beginAssistantStream({ reason: \"steer\" })",
  "}",
].join("\n")

const SLASH_COMMANDS: Suggestion[] = [
  { id: "review", label: "/review", description: "Run the review skill", kind: "skill" },
  { id: "docs", label: "/docs", description: "Run the documentation sweep skill", kind: "skill" },
  { id: "test", label: "/test", description: "Run validation and smoke tests", kind: "skill" },
  { id: "plan", label: "/plan", description: "Create an implementation plan", kind: "skill" },
]

const FILE_MENTIONS: Suggestion[] = [
  { id: "chat", label: "chat.tsx", description: "Interactive chat block", kind: "file" },
  { id: "scroller", label: "message-scroller.tsx", description: "Viewport and streaming behavior", kind: "file" },
  { id: "registry", label: "registry.json", description: "Aurora registry manifest", kind: "file" },
  { id: "readme", label: "README.md", description: "Aurora package guide", kind: "file" },
]

const MODELS = ["GPT-5.6", "Claude Sonnet 4.6", "Gemini 2.5 Pro"]
const REASONING_LEVELS = ["Auto", "Fast", "Balanced", "Deep"]

const INITIAL_ITEMS: DemoThreadItem[] = [
  { kind: "marker", id: "marker-today", label: "Today", variant: "separator" },
  { kind: "message", id: "assistant-welcome", role: "assistant", time: "9:31 PM", text: "The new conversation layer composes cleanly with Aurora's existing developer surfaces. Here's the lightweight snippet and the full steering helper.", showcase: "code", attachments: [{ id: "attachment-spec", title: "chat-primitives.md", description: "5 primitives · Aurora registry", state: "done" }] },
  { kind: "message", id: "user-compose", role: "user", time: "9:33 PM", text: "Show me the references too, and keep assistant replies out of bubbles." },
  { kind: "marker", id: "marker-context", label: "Conversation context synchronized", variant: "border", status: "synced" },
  { kind: "message", id: "assistant-compose", role: "assistant", time: "9:34 PM", text: "Assistant content is now plain conversational prose. Sources stay attached to the turn as compact references instead of becoming another oversized card stack.", showcase: "sources" },
  { kind: "message", id: "user-streaming", role: "user", time: "9:36 PM", text: "Nice. Can I steer while you're still replying?" },
  { kind: "message", id: "assistant-streaming", role: "assistant", time: "9:37 PM", text: "Yes. Keep typing while I stream. If the composer has text, Send steers the conversation. If it is empty, that same control becomes Stop." },
  { kind: "marker", id: "marker-live", label: "Interactive demo", variant: "separator", status: "ready" },
]

const MOCK_REPLY = "Exactly. This response is streaming through the Aurora mock while MessageScroller watches whether you are pinned to the end. Type a steering message while this is still arriving and send it without waiting for the current response to finish."
const STEER_REPLY = "Steering applied. I stopped the previous stream, preserved the partial response in the thread, and started a new response using your latest direction without locking the composer."
const RETRY_REPLY = "Retried locally. The assistant response streams again with the same plain-message layout, compact actions, code surfaces, sources, and composer controls."

function nextId(prefix: string) { return `${prefix}-${crypto.randomUUID()}` }
function currentTime() { return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date()) }

function AttachmentCard({ attachment, onOpen, onRemove, compact = false }: { attachment: DemoAttachment; onOpen: (attachment: DemoAttachment) => void; onRemove?: (attachment: DemoAttachment) => void; compact?: boolean }) {
  const pending = attachment.state === "uploading" || attachment.state === "processing"
  const description = attachment.state === "uploading" ? "Uploading mock file" : attachment.state === "processing" ? "Preparing attachment" : attachment.description
  return (
    <Attachment state={attachment.state} size={compact ? "xs" : "sm"} className={compact ? "max-w-[210px] flex-nowrap" : undefined}>
      <AttachmentMedia className={compact ? "[&_svg]:!size-3.5" : undefined}>{pending ? <Spinner size="sm" tone="cyan" /> : <FileText aria-hidden="true" />}</AttachmentMedia>
      <AttachmentContent><AttachmentTitle>{attachment.title}</AttachmentTitle>{compact ? null : <AttachmentDescription>{description}</AttachmentDescription>}</AttachmentContent>
      {onRemove ? <AttachmentActions><AttachmentAction type="button" className={compact ? "!size-5 rounded-[5px] [&_svg]:!size-3.5" : undefined} aria-label={"Remove " + attachment.title} onClick={() => onRemove(attachment)}><X data-icon="inline-start" aria-hidden="true" /></AttachmentAction></AttachmentActions> : null}
      <AttachmentTrigger aria-label={"Preview " + attachment.title} onClick={() => onOpen(attachment)} />
    </Attachment>
  )
}

function ThreadMarker({ item }: { item: DemoMarker }) {
  const Icon = item.status === "synced" ? CheckCheck : item.status === "ready" ? Check : Sparkles
  return <Marker variant={item.variant} role={item.status === "thinking" ? "status" : undefined}>{item.status ? <MarkerIcon>{item.status === "thinking" ? <Spinner size="sm" tone="rose" /> : <Icon aria-hidden="true" />}</MarkerIcon> : null}<MarkerContent>{item.label}</MarkerContent></Marker>
}

function AssistantShowcase({ kind }: { kind?: ShowcaseKind }) {
  if (kind === "code") {
    return (
      <div className="grid max-w-[560px] gap-1.5 pt-1">
        <Snippet density="compact" language="tsx" code={DEMO_SNIPPET} />
        <CodeBlock density="compact" language="typescript" filename="steering.ts" code={DEMO_CODE} showLineNumbers />
      </div>
    )
  }
  if (kind === "sources") {
    return (
      <Sources density="compact" title="Sources & references" collapsible defaultOpen className="max-w-[560px]">
        <Source density="compact" index={1} source={{ title: "shadcn chat components", href: "https://ui.shadcn.com/docs/changelog/2026-06-chat-components", badge: "DOCS" }} />
        <Source density="compact" index={2} source={{ title: "message-scroller.tsx", badge: "FILE" }} />
      </Sources>
    )
  }
  return null
}

function SuggestionPopup({ label, items, activeIndex, onSelect }: { label: string; items: Suggestion[]; activeIndex: number; onSelect: (item: Suggestion) => void }) {
  if (items.length === 0) return null
  return (
    <div role="listbox" aria-label={label} className="absolute bottom-[calc(100%+6px)] left-0 z-40 w-[min(320px,92%)] overflow-hidden rounded-[10px] border p-1" style={{ borderColor: "var(--aurora-border-strong)", background: "var(--aurora-surface-raised)", boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)" }}>
      {items.map((item, index) => (
        <Button key={item.id} type="button" variant="plain" size="unstyled" role="option" aria-selected={index === activeIndex} className="flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 text-left data-[selected=true]:bg-[var(--aurora-hover-bg)]" data-selected={index === activeIndex ? "true" : "false"} onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(item)}>
          {item.kind === "skill" ? <Command className="size-3.5 shrink-0" aria-hidden style={{ color: "var(--axon-orange)" }} /> : <FileCode2 className="size-3.5 shrink-0" aria-hidden style={{ color: "var(--aurora-accent-primary)" }} />}
          <span className="min-w-0 flex-1">
            <span className="block truncate" style={{ color: "var(--aurora-text-primary)", fontSize: "var(--aurora-type-label)", fontWeight: "var(--aurora-weight-ui)" }}>{item.label}</span>
            <span className="block truncate" style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-caption)" }}>{item.description}</span>
          </span>
          <span style={{ color: "var(--aurora-text-muted)", fontSize: "10px", textTransform: "uppercase" }}>{item.kind}</span>
        </Button>
      ))}
    </div>
  )
}

function CompactSelect({ label, value, options, onValueChange, icon }: { label: string; value: string; options: string[]; onValueChange: (value: string) => void; icon: React.ReactNode }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label} className="!h-6 !w-auto min-w-[98px] gap-1 rounded-[7px] !px-2 !py-0 [&>svg]:!size-3">
        <span className="flex min-w-0 items-center gap-1.5">{icon}<SelectValue /></span>
      </SelectTrigger>
      <SelectContent className="min-w-[150px]">
        {options.map((option) => <SelectItem key={option} value={option} className="!py-1 text-[11px]">{option}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export interface AuroraChatBlockProps { title?: string; subtitle?: string; className?: string }

function AuroraChatBlock({ title = "Aurora Chat", subtitle = "Composable conversation primitives", className }: AuroraChatBlockProps) {
  const [items, setItems] = React.useState<DemoThreadItem[]>(INITIAL_ITEMS)
  const [value, setValue] = React.useState("")
  const [composerAttachment, setComposerAttachment] = React.useState<DemoAttachment | null>(null)
  const [previewAttachment, setPreviewAttachment] = React.useState<DemoAttachment | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [likedIds, setLikedIds] = React.useState<Set<string>>(() => new Set())
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null)
  const [isResponding, setIsResponding] = React.useState(false)
  const [activeAssistantId, setActiveAssistantId] = React.useState<string | null>(null)
  const [model, setModel] = React.useState(MODELS[0])
  const [reasoning, setReasoning] = React.useState(REASONING_LEVELS[0])
  const [slashOpen, setSlashOpen] = React.useState(false)
  const [slashQuery, setSlashQuery] = React.useState("")
  const [slashIndex, setSlashIndex] = React.useState(0)
  const [mentionOpen, setMentionOpen] = React.useState(false)
  const [mentionQuery, setMentionQuery] = React.useState("")
  const [mentionIndex, setMentionIndex] = React.useState(0)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
  const streamTimerRef = React.useRef<number | null>(null)
  const responseTimerRef = React.useRef<number | null>(null)
  const timeoutRefs = React.useRef<Set<number>>(new Set())

  const filteredSlash = React.useMemo(() => SLASH_COMMANDS.filter((item) => item.label.toLowerCase().includes(slashQuery.toLowerCase())), [slashQuery])
  const filteredMentions = React.useMemo(() => FILE_MENTIONS.filter((item) => item.label.toLowerCase().includes(mentionQuery.toLowerCase())), [mentionQuery])
  const slashActiveIndex = Math.min(slashIndex, Math.max(filteredSlash.length - 1, 0))
  const mentionActiveIndex = Math.min(mentionIndex, Math.max(filteredMentions.length - 1, 0))

  const clearTimers = React.useCallback(() => {
    if (streamTimerRef.current != null) { window.clearInterval(streamTimerRef.current); streamTimerRef.current = null }
    if (responseTimerRef.current != null) { window.clearTimeout(responseTimerRef.current); responseTimerRef.current = null }
    timeoutRefs.current.forEach((timer) => window.clearTimeout(timer)); timeoutRefs.current.clear()
  }, [])

  const schedule = React.useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => { timeoutRefs.current.delete(timer); callback() }, delay)
    timeoutRefs.current.add(timer)
    return timer
  }, [])

  React.useEffect(() => clearTimers, [clearTimers])

  const stopResponse = React.useCallback(() => {
    if (streamTimerRef.current != null) { window.clearInterval(streamTimerRef.current); streamTimerRef.current = null }
    if (responseTimerRef.current != null) { window.clearTimeout(responseTimerRef.current); responseTimerRef.current = null }
    setItems((current) => current.filter((item) => item.kind !== "marker" || item.status !== "thinking").map((item) => item.kind === "message" && item.streaming ? { ...item, streaming: false } : item))
    setIsResponding(false)
    setActiveAssistantId(null)
  }, [])

  const streamIntoMessage = React.useCallback((messageId: string, fullText: string) => {
    if (streamTimerRef.current != null) window.clearInterval(streamTimerRef.current)
    const words = fullText.split(" ")
    let cursor = 0
    setIsResponding(true)
    setActiveAssistantId(messageId)
    setItems((current) => current.map((item) => item.kind === "message" && item.id === messageId ? { ...item, text: "", streaming: true } : item))
    streamTimerRef.current = window.setInterval(() => {
      cursor = Math.min(words.length, cursor + 2)
      const done = cursor >= words.length
      const text = words.slice(0, cursor).join(" ")
      setItems((current) => current.map((item) => item.kind === "message" && item.id === messageId ? { ...item, text, streaming: !done } : item))
      if (done && streamTimerRef.current != null) {
        window.clearInterval(streamTimerRef.current)
        streamTimerRef.current = null
        setIsResponding(false)
        setActiveAssistantId(null)
      }
    }, 54)
  }, [])

  const queueMockReply = React.useCallback((thinkingMarkerId: string, replyText = MOCK_REPLY) => {
    if (responseTimerRef.current != null) window.clearTimeout(responseTimerRef.current)
    setIsResponding(true)
    responseTimerRef.current = window.setTimeout(() => {
      responseTimerRef.current = null
      const assistantId = nextId("assistant")
      setItems((current) => [...current.filter((item) => item.id !== thinkingMarkerId), { kind: "message", id: assistantId, role: "assistant", time: currentTime(), text: "", streaming: true }])
      streamIntoMessage(assistantId, replyText)
    }, 420)
  }, [streamIntoMessage])

  const addMockAttachment = React.useCallback(() => {
    if (composerAttachment) return
    const attachment: DemoAttachment = { id: nextId("upload"), title: "gateway-health.json", description: "12 KB · JSON", state: "uploading" }
    setComposerAttachment(attachment)
    schedule(() => setComposerAttachment((current) => current?.id === attachment.id ? { ...current, state: "processing" } : current), 650)
    schedule(() => setComposerAttachment((current) => current?.id === attachment.id ? { ...current, state: "done" } : current), 1250)
  }, [composerAttachment, schedule])

  const insertSlashCommand = React.useCallback((item: Suggestion) => {
    setValue((current) => current.replace(/(?:^|\s)\/[\w-]*$/, (match) => match.replace(/\/[\w-]*$/, item.label + " ")))
    setSlashOpen(false)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }, [])

  const insertMention = React.useCallback((item: Suggestion) => {
    setValue((current) => current.replace(/@[\w./-]*$/, "@" + item.label + " "))
    setMentionOpen(false)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }, [])

  const handleComposerChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value
    setValue(next)
    const slashMatch = next.match(/(?:^|\s)\/([\w-]*)$/)
    if (slashMatch) {
      setSlashQuery(slashMatch[1])
      setSlashIndex(0)
      setSlashOpen(true)
      setMentionOpen(false)
      return
    }
    setSlashOpen(false)
    const mentionMatch = next.match(/@([\w./-]*)$/)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setMentionIndex(0)
      setMentionOpen(true)
    } else {
      setMentionOpen(false)
    }
  }, [])

  const submitMessage = React.useCallback(() => {
    const text = value.trim()
    if (!text && !composerAttachment) return

    if (editingMessageId) {
      setItems((current) => current.map((item) => item.kind === "message" && item.id === editingMessageId && item.role === "user" ? { ...item, text: text || item.text, time: currentTime() } : item))
      setEditingMessageId(null)
      setValue("")
      setComposerAttachment(null)
      return
    }

    const steering = isResponding
    if (steering) stopResponse()
    const userId = nextId("user")
    const markerId = nextId("thinking")
    const message: DemoMessage = { kind: "message", id: userId, role: "user", time: currentTime(), text: text || "Attached a file for context.", scrollAnchor: true, attachments: composerAttachment ? [{ ...composerAttachment, state: "done" }] : undefined }
    setItems((current) => [...current, message, { kind: "marker", id: markerId, label: steering ? "Steering the active response" : "Aurora is composing a response", status: "thinking" }])
    setValue("")
    setComposerAttachment(null)
    queueMockReply(markerId, steering ? STEER_REPLY : MOCK_REPLY)
  }, [composerAttachment, editingMessageId, isResponding, queueMockReply, stopResponse, value])

  const handleComposerKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen) {
      if (event.key === "ArrowDown") { event.preventDefault(); setSlashIndex((index) => (index + 1) % Math.max(filteredSlash.length, 1)); return }
      if (event.key === "ArrowUp") { event.preventDefault(); setSlashIndex((index) => (index - 1 + filteredSlash.length) % Math.max(filteredSlash.length, 1)); return }
      if (event.key === "Enter") { event.preventDefault(); const item = filteredSlash[slashActiveIndex]; if (item) insertSlashCommand(item); return }
      if (event.key === "Escape") { setSlashOpen(false); return }
    }
    if (mentionOpen) {
      if (event.key === "ArrowDown") { event.preventDefault(); setMentionIndex((index) => (index + 1) % Math.max(filteredMentions.length, 1)); return }
      if (event.key === "ArrowUp") { event.preventDefault(); setMentionIndex((index) => (index - 1 + filteredMentions.length) % Math.max(filteredMentions.length, 1)); return }
      if (event.key === "Enter") { event.preventDefault(); const item = filteredMentions[mentionActiveIndex]; if (item) insertMention(item); return }
      if (event.key === "Escape") { setMentionOpen(false); return }
    }
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submitMessage() }
  }, [filteredMentions, filteredSlash, insertMention, insertSlashCommand, mentionActiveIndex, mentionOpen, slashActiveIndex, slashOpen, submitMessage])

  const retryMessage = React.useCallback((messageId: string) => { if (!isResponding) streamIntoMessage(messageId, RETRY_REPLY) }, [isResponding, streamIntoMessage])
  const copyMessage = React.useCallback((message: DemoMessage) => {
    if (!navigator.clipboard) return
    void navigator.clipboard.writeText(message.text).then(() => { setCopiedId(message.id); schedule(() => setCopiedId((current) => current === message.id ? null : current), 1200) }).catch(() => undefined)
  }, [schedule])
  const toggleLike = React.useCallback((messageId: string) => setLikedIds((current) => { const next = new Set(current); if (next.has(messageId)) next.delete(messageId); else next.add(messageId); return next }), [])
  const editMessage = React.useCallback((message: DemoMessage) => { setEditingMessageId(message.id); setValue(message.text); window.requestAnimationFrame(() => textareaRef.current?.focus()) }, [])
  const resetDemo = React.useCallback(() => { clearTimers(); setItems(INITIAL_ITEMS); setValue(""); setComposerAttachment(null); setPreviewAttachment(null); setCopiedId(null); setLikedIds(new Set()); setEditingMessageId(null); setIsResponding(false); setActiveAssistantId(null); setSlashOpen(false); setMentionOpen(false) }, [clearTimers])

  const hasComposerPayload = Boolean(value.trim() || composerAttachment)
  const showStopButton = isResponding && !hasComposerPayload && !editingMessageId

  return (
    <section aria-label="Interactive Aurora chat demo" className={["flex h-[min(720px,78vh)] min-h-[560px] w-full min-w-0 flex-col overflow-hidden rounded-[16px] border", className].filter(Boolean).join(" ")} style={{ borderColor: "var(--aurora-border-strong)", background: "var(--aurora-page-bg)", boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)" }}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-1.5 sm:px-3.5" style={{ borderColor: "var(--aurora-border-default)", background: "color-mix(in srgb, var(--aurora-panel-strong) 92%, transparent)" }}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[9px] border [&_svg]:size-4" style={{ borderColor: "color-mix(in srgb, var(--axon-orange) 36%, var(--aurora-border-default))", background: "color-mix(in srgb, var(--axon-orange) 10%, var(--aurora-panel-medium))", color: "var(--axon-orange)" }}><Sparkles aria-hidden="true" /></span>
          <div className="min-w-0"><h2 className="truncate" style={{ fontFamily: "var(--aurora-font-display)", fontSize: "var(--aurora-type-body)", fontWeight: "var(--aurora-weight-heading)", lineHeight: "var(--aurora-line-dense)" }}>{title}</h2><p className="truncate" style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-caption)", lineHeight: "var(--aurora-line-dense)" }}>{subtitle}</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden items-center gap-1.5 rounded-full border px-2 py-0.5 sm:inline-flex" style={{ borderColor: "var(--aurora-border-default)", color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-label)" }}>
            <span className="aurora-status-dot" style={{ "--status-dot-color": "var(--aurora-success)" } as React.CSSProperties} />Local mock
          </span>
          <Button variant="ghost" size="sm" type="button" className="!h-6 !px-2 [&_svg]:!size-3.5" onClick={resetDemo}><RefreshCw data-icon="inline-start" aria-hidden="true" />Reset</Button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <MessageScrollerProvider autoScroll scrollPreviousItemPeek={48}>
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent className="gap-3 px-3.5 py-2.5 sm:px-4">
                {items.map((item) => (
                  <MessageScrollerItem key={item.id} messageId={item.id} scrollAnchor={item.kind === "message" ? item.scrollAnchor : false}>
                    {item.kind === "marker" ? <ThreadMarker item={item} /> : (
                      <MessageGroup className="gap-1">
                        <Message align={item.role === "user" ? "end" : "start"}>
                          {item.role === "assistant" ? <MessageAvatar aria-label="Aurora" className="!size-[22px] !min-w-[22px] [&_svg]:size-3"><Bot aria-hidden="true" /></MessageAvatar> : null}
                          <MessageContent className="gap-1">
                            {item.role === "assistant" ? <MessageHeader className="min-h-0 px-0"><span style={{ color: "var(--aurora-text-primary)", fontSize: "var(--aurora-type-caption)", fontWeight: "var(--aurora-weight-ui)" }}>Aurora</span></MessageHeader> : null}
                            <BubbleGroup>
                              <Bubble variant={item.role === "user" ? "default" : "ghost"} align={item.role === "user" ? "end" : "start"} className={item.role === "assistant" ? "max-w-[68ch]" : undefined}>
                                <BubbleContent style={item.role === "user" ? { padding: "7px 10px", lineHeight: "1.45" } : { lineHeight: "1.55" }}>
                                  {item.text}
                                  {item.streaming ? <span aria-hidden="true" className="ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] rounded-full" style={{ background: "var(--aurora-accent-pink)", animation: "aurora-msg-caret 1.1s steps(1) infinite" }} /> : null}
                                </BubbleContent>
                              </Bubble>
                              {item.attachments?.length ? <AttachmentGroup className="gap-1.5 py-0.5">{item.attachments.map((attachment) => <AttachmentCard key={attachment.id} attachment={attachment} onOpen={setPreviewAttachment} compact />)}</AttachmentGroup> : null}
                            </BubbleGroup>
                            {item.role === "assistant" ? <AssistantShowcase kind={item.showcase} /> : null}
                            {item.role === "assistant" ? (
                              <MessageFooter className="min-h-0 gap-0.5 px-0 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus-within/message:opacity-100">
                                <span className="mr-1" style={{ color: "var(--aurora-text-muted)", fontSize: "10.5px" }}>{item.time}</span>
                                <Button type="button" variant="plain" size="unstyled" className="flex size-5 items-center justify-center rounded-[5px] [&_svg]:!size-3.5" aria-label={copiedId === item.id ? "Copied" : "Copy message"} onClick={() => copyMessage(item)}>{copiedId === item.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</Button>
                                <Button type="button" variant="plain" size="unstyled" className="flex size-5 items-center justify-center rounded-[5px] [&_svg]:!size-3.5" aria-label="Retry message" disabled={isResponding} onClick={() => retryMessage(item.id)}><RotateCcw aria-hidden="true" /></Button>
                                <Button type="button" variant="plain" size="unstyled" className="flex size-5 items-center justify-center rounded-[5px] [&_svg]:!size-3.5" aria-label={likedIds.has(item.id) ? "Remove reaction" : "Like message"} aria-pressed={likedIds.has(item.id)} onClick={() => toggleLike(item.id)} style={{ color: likedIds.has(item.id) ? "var(--aurora-accent-primary)" : "var(--aurora-text-muted)" }}><ThumbsUp aria-hidden="true" /></Button>
                              </MessageFooter>
                            ) : (
                              <MessageFooter className="min-h-0 justify-end gap-0.5 px-0 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus-within/message:opacity-100">
                                <span className="mr-1" style={{ color: "var(--aurora-text-muted)", fontSize: "10.5px" }}>{item.time}</span>
                                <Button type="button" variant="plain" size="unstyled" className="flex size-5 items-center justify-center rounded-[5px] [&_svg]:!size-3.5" aria-label="Edit message" onClick={() => editMessage(item)}><Pencil aria-hidden="true" /></Button>
                              </MessageFooter>
                            )}
                          </MessageContent>
                        </Message>
                      </MessageGroup>
                    )}
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton direction="start" className="!size-6 rounded-[7px] [&_svg]:!size-3.5" />
            <MessageScrollerButton direction="end" variant="aurora" className="!size-6 rounded-[7px] [&_svg]:!size-3.5" />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {previewAttachment ? <div className="mx-3 mb-1.5 flex shrink-0 items-center gap-2 rounded-[9px] border px-2 py-1.5" role="region" aria-label="Attachment preview" style={{ borderColor: "color-mix(in srgb, var(--aurora-accent-primary) 28%, var(--aurora-border-default))", background: "color-mix(in srgb, var(--aurora-accent-primary) 6%, var(--aurora-panel-medium))" }}>
        <FileText className="size-3.5" aria-hidden="true" style={{ color: "var(--aurora-accent-primary)" }} />
        <div className="min-w-0 flex-1"><p className="truncate" style={{ fontSize: "var(--aurora-type-label)", fontWeight: "var(--aurora-weight-ui)", lineHeight: "var(--aurora-line-dense)" }}>{previewAttachment.title}</p><p className="truncate" style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-caption)", lineHeight: "var(--aurora-line-dense)" }}>Mock preview · {previewAttachment.description}</p></div>
        <Button type="button" variant="ghost" size="icon" className="!size-6 [&_svg]:!size-3.5" aria-label="Close preview" onClick={() => setPreviewAttachment(null)}><X aria-hidden="true" /></Button>
      </div> : null}

      <form className="relative shrink-0 border-t p-2" style={{ borderColor: "var(--aurora-border-default)", background: "color-mix(in srgb, var(--aurora-panel-strong) 94%, transparent)" }} onSubmit={(event) => { event.preventDefault(); if (!showStopButton) submitMessage() }}>
        {composerAttachment ? <AttachmentGroup className="mb-1.5 gap-1 py-0"><AttachmentCard attachment={composerAttachment} onOpen={setPreviewAttachment} onRemove={() => setComposerAttachment(null)} compact /></AttachmentGroup> : null}
        <div className="overflow-hidden rounded-[11px] border" style={{ borderColor: "var(--aurora-border-strong)", background: "var(--aurora-control-surface)", boxShadow: "var(--aurora-highlight-medium)" }}>
          <div className="relative">
            <SuggestionPopup label="Skills and slash commands" items={slashOpen ? filteredSlash : []} activeIndex={slashActiveIndex} onSelect={insertSlashCommand} />
            <SuggestionPopup label="File mentions" items={mentionOpen ? filteredMentions : []} activeIndex={mentionActiveIndex} onSelect={insertMention} />
            <Button type="button" variant="ghost" size="icon" className="absolute bottom-1 left-1 z-10 !size-6 [&_svg]:!size-3.5" aria-label="Add mock attachment" disabled={Boolean(composerAttachment)} onClick={addMockAttachment}><Paperclip aria-hidden="true" /></Button>
            <Textarea ref={textareaRef} unstyled autoGrow rows={1} value={value} aria-label="Message" aria-autocomplete="list" aria-expanded={slashOpen || mentionOpen} placeholder={editingMessageId ? "Edit your message…" : isResponding ? "Steer the response…" : "Ask Aurora anything…"} className="max-h-[96px] min-h-[38px] w-full resize-none bg-transparent px-9 py-2 outline-none" style={{ color: "var(--aurora-text-primary)", fontFamily: "var(--aurora-font-sans)", fontSize: "var(--aurora-type-body-sm)", lineHeight: "var(--aurora-line-body)", caretColor: "var(--aurora-accent-primary)" }} onChange={handleComposerChange} onKeyDown={handleComposerKeyDown} />
            {showStopButton ? (
              <Button type="button" variant="destructive" size="icon" className="absolute bottom-1 right-1 z-10 !size-6 rounded-[7px] [&_svg]:!size-3" aria-label="Stop response" onClick={stopResponse}><Square fill="currentColor" aria-hidden="true" /></Button>
            ) : (
              <Button type="submit" variant="rose" size="icon" filled className="absolute bottom-1 right-1 z-10 !size-6 rounded-[7px] [&_svg]:!size-3.5" aria-label={editingMessageId ? "Save edited message" : isResponding ? "Send steering message" : "Send message"} disabled={!hasComposerPayload}><Send aria-hidden="true" /></Button>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 border-t px-1.5 py-1" style={{ borderColor: "color-mix(in srgb, var(--aurora-border-default) 72%, transparent)", background: "color-mix(in srgb, var(--aurora-control-surface) 45%, transparent)" }}>
            <CompactSelect label="Model" value={model} options={MODELS} onValueChange={setModel} icon={<Cpu className="size-3 shrink-0" aria-hidden style={{ color: "var(--axon-orange)" }} />} />
            <CompactSelect label="Reasoning" value={reasoning} options={REASONING_LEVELS} onValueChange={setReasoning} icon={<Brain className="size-3 shrink-0" aria-hidden style={{ color: "var(--aurora-accent-pink)" }} />} />
            <span className="hidden min-w-0 truncate sm:inline" style={{ color: "var(--aurora-text-muted)", fontSize: "10px" }}><AtSign className="mr-1 inline size-3" aria-hidden />files · / skills</span>
            <span className="flex-1" />
            {editingMessageId ? <Button type="button" variant="plain" size="unstyled" className="flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 [&_svg]:size-3" onClick={() => { setEditingMessageId(null); setValue("") }} style={{ color: "var(--aurora-text-muted)", fontSize: "10px" }}><X aria-hidden="true" />Cancel edit</Button> : null}
            {isResponding ? <span aria-live="polite" style={{ color: "var(--axon-orange)", fontSize: "10px" }}>{activeAssistantId ? "Streaming" : "Thinking"}</span> : null}
          </div>
        </div>
      </form>
    </section>
  )
}

export { AuroraChatBlock }
export default AuroraChatBlock
