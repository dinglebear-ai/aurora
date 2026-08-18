import { Bot, CheckCheck, User } from "lucide-react"

import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { Bubble, BubbleContent } from "@/registry/aurora/ui/bubble"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from "@/registry/aurora/ui/message"

export default function MessagePrimitiveDemo() {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <GalleryPageIntro
        eyebrow="Chat Primitives"
        heading="Message"
        description="Conversation structure stays separate from presentation: align turns, attach avatars, and compose headers or footers without owning message state."
      />
      <div className="flex max-w-[720px] flex-col gap-6 rounded-[16px] border p-5" style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-page-bg)" }}>
        <MessageGroup>
          <Message>
            <MessageAvatar><Bot aria-hidden="true" /></MessageAvatar>
            <MessageContent>
              <MessageHeader>Aurora <span aria-hidden="true" className="mx-1">·</span> 9:41 PM</MessageHeader>
              <Bubble variant="muted"><BubbleContent>Message owns the turn structure. Bubble decides how this particular payload should look.</BubbleContent></Bubble>
              <MessageFooter><CheckCheck aria-hidden="true" />Delivered through the local mock</MessageFooter>
            </MessageContent>
          </Message>
          <Message align="end">
            <MessageAvatar><User aria-hidden="true" /></MessageAvatar>
            <MessageContent>
              <MessageHeader>You <span aria-hidden="true" className="mx-1">·</span> 9:42 PM</MessageHeader>
              <Bubble align="end"><BubbleContent>So alignment is structural, not baked into a one-off chat card.</BubbleContent></Bubble>
              <MessageFooter>Exactly.</MessageFooter>
            </MessageContent>
          </Message>
        </MessageGroup>
      </div>
    </div>
  )
}
