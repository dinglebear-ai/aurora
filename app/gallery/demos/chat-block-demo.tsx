"use client"

import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { AuroraChatBlock } from "@/registry/aurora/blocks/ai/chat/chat"

export default function ChatBlockDemo() {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <GalleryPageIntro
        eyebrow="AI Blocks"
        heading="Interactive Chat"
        description="Aurora-native conversation primitives composed into a local interactive chat with streaming, attachments, markers, reactions, and scroll controls."
      />
      <AuroraChatBlock />
    </div>
  )
}
