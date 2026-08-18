"use client"

import * as React from "react"
import { FileImage, FileText, X } from "lucide-react"

import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle, AttachmentTrigger } from "@/registry/aurora/ui/attachment"
import { Spinner } from "@/registry/aurora/ui/spinner"

const FILES = [
  { id: "done", title: "architecture.md", description: "18 KB · Markdown", state: "done" as const },
  { id: "uploading", title: "trace.json", description: "Uploading", state: "uploading" as const },
  { id: "processing", title: "screenshot.png", description: "Processing preview", state: "processing" as const },
  { id: "error", title: "broken.log", description: "Upload failed", state: "error" as const },
]

export default function ChatAttachmentDemo() {
  const [preview, setPreview] = React.useState("Select an attachment to preview its mock metadata.")
  const [visible, setVisible] = React.useState(() => new Set(FILES.map((file) => file.id)))

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <GalleryPageIntro
        eyebrow="Chat Primitives"
        heading="Attachment"
        description="Composable conversation files with lifecycle state, media, metadata, actions, full-card triggers, sizes, and orientations."
      />
      <div className="flex max-w-[780px] flex-col gap-4">
        <AttachmentGroup>
          {FILES.filter((file) => visible.has(file.id)).map((file) => {
            const pending = file.state === "uploading" || file.state === "processing"
            return (
              <Attachment key={file.id} state={file.state} size="sm">
                <AttachmentMedia>{pending ? <Spinner size="sm" tone="cyan" /> : file.id === "processing" ? <FileImage aria-hidden="true" /> : <FileText aria-hidden="true" />}</AttachmentMedia>
                <AttachmentContent><AttachmentTitle>{file.title}</AttachmentTitle><AttachmentDescription>{file.description}</AttachmentDescription></AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction type="button" aria-label={"Remove " + file.title} onClick={() => setVisible((current) => { const next = new Set(current); next.delete(file.id); return next })}>
                    <X data-icon="inline-start" aria-hidden="true" />
                  </AttachmentAction>
                </AttachmentActions>
                <AttachmentTrigger aria-label={"Preview " + file.title} onClick={() => setPreview(file.title + " · " + file.description + " · " + file.state)} />
              </Attachment>
            )
          })}
        </AttachmentGroup>
        <div className="rounded-[12px] border px-3 py-2" role="status" style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-panel-medium)", color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-caption)" }}>{preview}</div>
        <Attachment state="done" orientation="vertical">
          <AttachmentMedia><FileImage aria-hidden="true" /></AttachmentMedia>
          <AttachmentContent><AttachmentTitle>vertical-card.png</AttachmentTitle><AttachmentDescription>Vertical orientation</AttachmentDescription></AttachmentContent>
          <AttachmentTrigger aria-label="Preview vertical-card.png" onClick={() => setPreview("vertical-card.png · vertical orientation")} />
        </Attachment>
      </div>
    </div>
  )
}
