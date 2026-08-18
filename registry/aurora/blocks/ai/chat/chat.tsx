"use client"

import * as React from "react"
import { Bot, Check, CheckCheck, Copy, FileText, Paperclip, RefreshCw, RotateCcw, Send, Sparkles, ThumbsUp, X } from "lucide-react"

import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle, AttachmentTrigger, type AttachmentState } from "@/registry/aurora/ui/attachment"
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/registry/aurora/ui/bubble"
import { Button } from "@/registry/aurora/ui/button"
import { Marker, MarkerContent, MarkerIcon } from "@/registry/aurora/ui/marker"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from "@/registry/aurora/ui/message"
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/registry/aurora/ui/message-scroller"
import { Spinner } from "@/registry/aurora/ui/spinner"
import { Textarea } from "@/registry/aurora/ui/textarea"

type DemoAttachment = { id: string; title: string; description: string; state: AttachmentState }
type DemoMessage = { kind: "message"; id: string; role: "assistant" | "user"; text: string; time: string; streaming?: boolean; scrollAnchor?: boolean; attachments?: DemoAttachment[] }
type DemoMarker = { kind: "marker"; id: string; label: string; variant?: "default" | "separator" | "border"; status?: "thinking" | "ready" | "synced" }
type DemoThreadItem = DemoMessage | DemoMarker

const INITIAL_ITEMS: DemoThreadItem[] = [
  { kind: "marker", id: "marker-today", label: "Today", variant: "separator" },
  { kind: "message", id: "assistant-welcome", role: "assistant", time: "9:31 PM", text: "I wired the new conversation layer into Aurora. Messages handle structure, bubbles handle presentation, and the scroller owns the tricky viewport behavior.", attachments: [{ id: "attachment-spec", title: "chat-primitives.md", description: "5 primitives · Aurora registry", state: "done" }] },
  { kind: "message", id: "user-compose", role: "user", time: "9:33 PM", text: "Show me how the pieces compose without coupling message state to the renderer." },
  { kind: "marker", id: "marker-context", label: "Conversation context synchronized", variant: "border", status: "synced" },
  { kind: "message", id: "assistant-compose", role: "assistant", time: "9:34 PM", text: "The thread is intentionally headless at the data layer. A message chooses alignment, Bubble chooses visual intent, Attachment composes file metadata, Marker carries timeline state, and MessageScroller coordinates the viewport. You can swap any one without rewriting the others." },
  { kind: "message", id: "user-streaming", role: "user", time: "9:36 PM", text: "Nice. Can it stream while I scroll away and then give me a jump-to-latest control?" },
  { kind: "message", id: "assistant-streaming", role: "assistant", time: "9:37 PM", text: "Yes. Auto-follow stays active while you are pinned to the end. Scroll upward and it yields control to you; new content keeps arriving without stealing the viewport, and the floating control brings you back when you are ready." },
  { kind: "marker", id: "marker-live", label: "Interactive demo", variant: "separator", status: "ready" },
]

const MOCK_REPLY = "Exactly. This response is streaming through the Aurora mock while MessageScroller watches whether you are pinned to the end. Scroll upward during the stream and it stops following you. The jump control appears so you can return to the latest turn on your own terms."
const RETRY_REPLY = "Retried locally. The message body is streaming again without replacing the surrounding layout, attachments, markers, or reaction controls. That separation is the useful part of the new primitive model."

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

export interface AuroraChatBlockProps { title?: string; subtitle?: string; className?: string }

function AuroraChatBlock({ title = "Aurora Chat", subtitle = "Composable conversation primitives", className }: AuroraChatBlockProps) {
  const [items, setItems] = React.useState<DemoThreadItem[]>(INITIAL_ITEMS)
  const [value, setValue] = React.useState("")
  const [composerAttachment, setComposerAttachment] = React.useState<DemoAttachment | null>(null)
  const [previewAttachment, setPreviewAttachment] = React.useState<DemoAttachment | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [likedIds, setLikedIds] = React.useState<Set<string>>(() => new Set())
  const [isResponding, setIsResponding] = React.useState(false)
  const streamTimerRef = React.useRef<number | null>(null)
  const timeoutRefs = React.useRef<Set<number>>(new Set())

  const clearTimers = React.useCallback(() => {
    if (streamTimerRef.current != null) { window.clearInterval(streamTimerRef.current); streamTimerRef.current = null }
    timeoutRefs.current.forEach((timer) => window.clearTimeout(timer)); timeoutRefs.current.clear()
  }, [])
  const schedule = React.useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => { timeoutRefs.current.delete(timer); callback() }, delay)
    timeoutRefs.current.add(timer); return timer
  }, [])
  React.useEffect(() => clearTimers, [clearTimers])

  const streamIntoMessage = React.useCallback((messageId: string, fullText: string) => {
    if (streamTimerRef.current != null) window.clearInterval(streamTimerRef.current)
    const words = fullText.split(" "); let cursor = 0; setIsResponding(true)
    setItems((current) => current.map((item) => item.kind === "message" && item.id === messageId ? { ...item, text: "", streaming: true } : item))
    streamTimerRef.current = window.setInterval(() => {
      cursor = Math.min(words.length, cursor + 2); const done = cursor >= words.length; const text = words.slice(0, cursor).join(" ")
      setItems((current) => current.map((item) => item.kind === "message" && item.id === messageId ? { ...item, text, streaming: !done } : item))
      if (done && streamTimerRef.current != null) { window.clearInterval(streamTimerRef.current); streamTimerRef.current = null; setIsResponding(false) }
    }, 54)
  }, [])

  const queueMockReply = React.useCallback((thinkingMarkerId: string) => {
    schedule(() => {
      const assistantId = nextId("assistant")
      setItems((current) => [...current.filter((item) => item.id !== thinkingMarkerId), { kind: "message", id: assistantId, role: "assistant", time: currentTime(), text: "", streaming: true }])
      streamIntoMessage(assistantId, MOCK_REPLY)
    }, 520)
  }, [schedule, streamIntoMessage])

  const addMockAttachment = React.useCallback(() => {
    if (composerAttachment) return
    const attachment: DemoAttachment = { id: nextId("upload"), title: "gateway-health.json", description: "12 KB · JSON", state: "uploading" }
    setComposerAttachment(attachment)
    schedule(() => setComposerAttachment((current) => current?.id === attachment.id ? { ...current, state: "processing" } : current), 650)
    schedule(() => setComposerAttachment((current) => current?.id === attachment.id ? { ...current, state: "done" } : current), 1250)
  }, [composerAttachment, schedule])

  const submitMessage = React.useCallback(() => {
    const text = value.trim(); if ((!text && !composerAttachment) || isResponding) return
    const userId = nextId("user"); const markerId = nextId("thinking")
    const message: DemoMessage = { kind: "message", id: userId, role: "user", time: currentTime(), text: text || "Attached a file for context.", scrollAnchor: true, attachments: composerAttachment ? [{ ...composerAttachment, state: "done" }] : undefined }
    setItems((current) => [...current, message, { kind: "marker", id: markerId, label: "Aurora is composing a response", status: "thinking" }])
    setValue(""); setComposerAttachment(null); setIsResponding(true); queueMockReply(markerId)
  }, [composerAttachment, isResponding, queueMockReply, value])

  const retryMessage = React.useCallback((messageId: string) => { if (!isResponding) streamIntoMessage(messageId, RETRY_REPLY) }, [isResponding, streamIntoMessage])
  const copyMessage = React.useCallback((message: DemoMessage) => {
    if (!navigator.clipboard) return
    void navigator.clipboard.writeText(message.text).then(() => { setCopiedId(message.id); schedule(() => setCopiedId((current) => current === message.id ? null : current), 1200) }).catch(() => undefined)
  }, [schedule])
  const toggleLike = React.useCallback((messageId: string) => setLikedIds((current) => { const next = new Set(current); if (next.has(messageId)) next.delete(messageId); else next.add(messageId); return next }), [])
  const resetDemo = React.useCallback(() => { clearTimers(); setItems(INITIAL_ITEMS); setValue(""); setComposerAttachment(null); setPreviewAttachment(null); setCopiedId(null); setLikedIds(new Set()); setIsResponding(false) }, [clearTimers])

  return (
    <section aria-label="Interactive Aurora chat demo" className={["flex h-[min(660px,74vh)] min-h-[520px] w-full min-w-0 flex-col overflow-hidden rounded-[16px] border", className].filter(Boolean).join(" ")} style={{ borderColor: "var(--aurora-border-strong)", background: "var(--aurora-page-bg)", boxShadow: "var(--aurora-shadow-strong), var(--aurora-highlight-strong)" }}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2 sm:px-4" style={{ borderColor: "var(--aurora-border-default)", background: "color-mix(in srgb, var(--aurora-panel-strong) 92%, transparent)" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[9px] border [&_svg]:size-4" style={{ borderColor: "color-mix(in srgb, var(--axon-orange) 36%, var(--aurora-border-default))", background: "color-mix(in srgb, var(--axon-orange) 10%, var(--aurora-panel-medium))", color: "var(--axon-orange)" }}><Sparkles aria-hidden="true" /></span>
          <div className="min-w-0"><h2 className="truncate" style={{ fontFamily: "var(--aurora-font-display)", fontSize: "var(--aurora-type-body)", fontWeight: "var(--aurora-weight-heading)", lineHeight: "var(--aurora-line-dense)" }}>{title}</h2><p className="truncate" style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-caption)", lineHeight: "var(--aurora-line-dense)" }}>{subtitle}</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border px-2 py-0.5 sm:inline-flex" style={{ borderColor: "var(--aurora-border-default)", color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-label)" }}>
            <span className="aurora-status-dot" style={{ "--status-dot-color": "var(--aurora-success)" } as React.CSSProperties} />Local mock
          </span>
          <Button variant="ghost" size="sm" type="button" className="!h-6 !px-2 [&_svg]:!size-3.5" onClick={resetDemo}><RefreshCw data-icon="inline-start" aria-hidden="true" />Reset</Button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <MessageScrollerProvider autoScroll scrollPreviousItemPeek={56}>
          <MessageScroller>
            <MessageScrollerViewport>
              <MessageScrollerContent className="gap-3 px-3.5 py-2.5 sm:px-4">
                {items.map((item) => (
                  <MessageScrollerItem key={item.id} messageId={item.id} scrollAnchor={item.kind === "message" ? item.scrollAnchor : false}>
                    {item.kind === "marker" ? <ThreadMarker item={item} /> : (
                      <MessageGroup className="gap-1">
                        <Message align={item.role === "user" ? "end" : "start"}>
                          {item.role === "assistant" ? (
                            <MessageAvatar aria-label="Aurora" className="!size-[22px] !min-w-[22px] [&_svg]:size-3">
                              <Bot aria-hidden="true" />
                            </MessageAvatar>
                          ) : null}
                          <MessageContent className="gap-1">
                            {item.role === "assistant" ? (
                              <MessageHeader className="min-h-0 gap-1 px-0" style={{ fontSize: "var(--aurora-type-caption)" }}>
                                <span style={{ color: "var(--aurora-text-primary)", fontWeight: "var(--aurora-weight-ui)" }}>Aurora</span>
                                <span aria-hidden="true">·</span>
                                <span>{item.time}</span>
                              </MessageHeader>
                            ) : null}
                            <BubbleGroup>
                              <Bubble variant={item.role === "user" ? "default" : "tinted"} align={item.role === "user" ? "end" : "start"} className={item.role === "assistant" && !item.streaming ? "pb-2" : undefined}>
                                <BubbleContent style={{ padding: "7px 10px", lineHeight: "1.45" }}>
                                  {item.text}
                                  {item.streaming ? <span aria-hidden="true" className="ml-1 inline-block h-[1em] w-[2px] translate-y-[2px] rounded-full" style={{ background: "var(--aurora-accent-pink)", animation: "aurora-msg-caret 1.1s steps(1) infinite" }} /> : null}
                                </BubbleContent>
                                {item.role === "assistant" && !item.streaming ? (
                                  <BubbleReactions className="!min-h-0 !p-0.5 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus-within/message:opacity-100">
                                    <Button type="button" variant="plain" size="unstyled" className="flex size-[18px] items-center justify-center rounded-full [&_svg]:!size-3.5" aria-pressed={likedIds.has(item.id)} aria-label={likedIds.has(item.id) ? "Remove reaction" : "Like message"} onClick={() => toggleLike(item.id)} style={{ color: likedIds.has(item.id) ? "var(--aurora-accent-primary)" : "var(--aurora-text-muted)" }}>
                                      <ThumbsUp data-icon="inline-start" aria-hidden="true" />
                                    </Button>
                                  </BubbleReactions>
                                ) : null}
                              </Bubble>
                              {item.attachments?.length ? <AttachmentGroup className="gap-1.5 py-0.5">{item.attachments.map((attachment) => <AttachmentCard key={attachment.id} attachment={attachment} onOpen={setPreviewAttachment} compact />)}</AttachmentGroup> : null}
                            </BubbleGroup>
                            {item.role === "assistant" && !item.streaming ? (
                              <MessageFooter className="min-h-0 gap-1 px-0 opacity-0 transition-opacity duration-150 group-hover/message:opacity-100 group-focus-within/message:opacity-100">
                                <Button type="button" variant="plain" size="unstyled" className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 transition-colors hover:bg-[color-mix(in_srgb,var(--aurora-accent-primary)_10%,transparent)] [&_svg]:!size-3.5" aria-label={copiedId === item.id ? "Copied" : "Copy message"} onClick={() => copyMessage(item)} style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-label)", fontWeight: "var(--aurora-weight-ui)" }}>
                                  {copiedId === item.id ? <Check data-icon="inline-start" aria-hidden="true" /> : <Copy data-icon="inline-start" aria-hidden="true" />}{copiedId === item.id ? "Copied" : "Copy"}
                                </Button>
                                <Button type="button" variant="plain" size="unstyled" className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 transition-colors hover:bg-[color-mix(in_srgb,var(--aurora-accent-pink)_10%,transparent)] [&_svg]:!size-3.5" aria-label="Retry message" disabled={isResponding} onClick={() => retryMessage(item.id)} style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-label)", fontWeight: "var(--aurora-weight-ui)" }}>
                                  <RotateCcw data-icon="inline-start" aria-hidden="true" />Retry
                                </Button>
                              </MessageFooter>
                            ) : null}
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

      {previewAttachment ? <div className="mx-4 mb-2 flex shrink-0 items-center gap-3 rounded-[12px] border px-3 py-2 sm:mx-5" role="region" aria-label="Attachment preview" style={{ borderColor: "color-mix(in srgb, var(--aurora-accent-primary) 28%, var(--aurora-border-default))", background: "color-mix(in srgb, var(--aurora-accent-primary) 6%, var(--aurora-panel-medium))" }}>
        <FileText aria-hidden="true" style={{ color: "var(--aurora-accent-primary)" }} />
        <div className="min-w-0 flex-1"><p className="truncate" style={{ fontSize: "var(--aurora-type-label)", fontWeight: "var(--aurora-weight-ui)", lineHeight: "var(--aurora-line-dense)" }}>{previewAttachment.title}</p><p className="truncate" style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-caption)", lineHeight: "var(--aurora-line-dense)" }}>Mock preview · {previewAttachment.description}</p></div>
        <Button type="button" variant="ghost" size="icon" className="!size-7 [&_svg]:!size-4" aria-label="Close preview" onClick={() => setPreviewAttachment(null)}><X data-icon="inline-start" aria-hidden="true" /></Button>
      </div> : null}

      <form className="shrink-0 border-t p-2" style={{ borderColor: "var(--aurora-border-default)", background: "color-mix(in srgb, var(--aurora-panel-strong) 94%, transparent)" }} onSubmit={(event) => { event.preventDefault(); submitMessage() }}>
        {composerAttachment ? <AttachmentGroup className="mb-1.5 gap-1 py-0"><AttachmentCard attachment={composerAttachment} onOpen={setPreviewAttachment} onRemove={() => setComposerAttachment(null)} compact /></AttachmentGroup> : null}
        <div className="overflow-hidden rounded-[11px] border" style={{ borderColor: "var(--aurora-border-strong)", background: "var(--aurora-control-surface)", boxShadow: "var(--aurora-highlight-medium)" }}>
          <Textarea unstyled autoGrow rows={1} value={value} disabled={isResponding} aria-label="Message" placeholder={isResponding ? "Aurora is responding…" : "Ask Aurora anything…"} className="max-h-[96px] min-h-[30px] w-full resize-none bg-transparent px-2.5 py-2 outline-none" style={{ color: "var(--aurora-text-primary)", fontFamily: "var(--aurora-font-sans)", fontSize: "var(--aurora-type-body-sm)", lineHeight: "var(--aurora-line-body)", caretColor: "var(--aurora-accent-primary)" }} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submitMessage() } }} />
          <div className="flex items-center gap-1 border-t px-1 py-0.5" style={{ borderColor: "color-mix(in srgb, var(--aurora-border-default) 72%, transparent)", background: "color-mix(in srgb, var(--aurora-control-surface) 45%, transparent)" }}>
            <Button type="button" variant="ghost" size="icon" className="!size-6 [&_svg]:!size-3.5" aria-label="Add mock attachment" disabled={Boolean(composerAttachment) || isResponding} onClick={addMockAttachment}><Paperclip data-icon="inline-start" aria-hidden="true" /></Button>
            <span className="hidden sm:inline" style={{ color: "var(--aurora-text-muted)", fontSize: "11px", lineHeight: 1 }}>Enter sends · Shift + Enter for newline</span>
            <span className="flex-1" />
            <Button type="submit" variant="rose" size="icon" filled className="!size-6 rounded-[7px] [&_svg]:!size-3.5" aria-label="Send message" disabled={isResponding || (!value.trim() && !composerAttachment)}>{isResponding ? <Spinner size="sm" tone="rose" /> : <Send data-icon="inline-start" aria-hidden="true" />}</Button>
          </div>
        </div>
      </form>
    </section>
  )
}

export { AuroraChatBlock }
export default AuroraChatBlock
