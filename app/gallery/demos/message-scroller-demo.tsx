"use client"

import * as React from "react"
import { Bot, Plus, User } from "lucide-react"

import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { Bubble, BubbleContent } from "@/registry/aurora/ui/bubble"
import { Button } from "@/registry/aurora/ui/button"
import { Message, MessageAvatar, MessageContent } from "@/registry/aurora/ui/message"
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from "@/registry/aurora/ui/message-scroller"

const STARTER = Array.from({ length: 9 }, (_, index) => ({
  id: "scroll-demo-" + index,
  role: index % 2 === 0 ? "assistant" as const : "user" as const,
  text: index === 8 ? "Scroll upward, then append a turn. The viewport should stay yours until you jump back to the end." : "Conversation turn " + (index + 1) + " keeps enough history around to make the scroll policy visible.",
}))

export default function MessageScrollerDemo() {
  const [messages, setMessages] = React.useState(STARTER)

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <GalleryPageIntro
        eyebrow="Chat Primitives"
        heading="Message Scroller"
        description="Pinned-end streaming behavior, user-scroll yielding, anchored turns, and explicit jump controls in an Aurora viewport."
      />
      <div className="flex max-w-[720px] flex-col gap-3">
        <div className="h-[430px] overflow-hidden rounded-[16px] border" style={{ borderColor: "var(--aurora-border-strong)", background: "var(--aurora-page-bg)", boxShadow: "var(--aurora-highlight-medium)" }}>
          <MessageScrollerProvider autoScroll>
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="px-4 py-5">
                  {messages.map((item) => (
                    <MessageScrollerItem key={item.id} messageId={item.id}>
                      <Message align={item.role === "user" ? "end" : "start"}>
                        <MessageAvatar>{item.role === "user" ? <User aria-hidden="true" /> : <Bot aria-hidden="true" />}</MessageAvatar>
                        <MessageContent>
                          <Bubble variant={item.role === "user" ? "default" : "muted"} align={item.role === "user" ? "end" : "start"}>
                            <BubbleContent>{item.text}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton direction="start" />
              <MessageScrollerButton direction="end" variant="aurora" />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-caption)", margin: 0 }}>Scroll away from the end before appending to see auto-follow yield.</p>
          <Button type="button" variant="ghost" onClick={() => setMessages((current) => [...current, { id: "scroll-demo-" + Date.now(), role: current.length % 2 === 0 ? "assistant" : "user", text: "A newly appended turn arrived without changing the component contract." }])}>
            <Plus data-icon="inline-start" aria-hidden="true" />Append turn
          </Button>
        </div>
      </div>
    </div>
  )
}
