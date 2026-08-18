import { ThumbsUp } from "lucide-react"

import { GalleryPageIntro } from "@/components/gallery-page-intro"
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/registry/aurora/ui/bubble"
import { Button } from "@/registry/aurora/ui/button"

const VARIANTS = ["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const

export default function BubbleDemo() {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <GalleryPageIntro
        eyebrow="Chat Primitives"
        heading="Bubble"
        description="Presentation stays swappable across seven Aurora visual intents, with optional reaction surfaces positioned independently from message structure."
      />
      <BubbleGroup className="max-w-[720px] gap-5 rounded-[16px] border p-5" style={{ borderColor: "var(--aurora-border-default)", background: "var(--aurora-page-bg)" }}>
        {VARIANTS.map((variant) => (
          <div key={variant} className="flex items-center gap-4">
            <span className="w-24 shrink-0" style={{ color: "var(--aurora-text-muted)", fontSize: "var(--aurora-type-label)", fontWeight: "var(--aurora-weight-ui)" }}>{variant}</span>
            <Bubble variant={variant} className={variant === "tinted" ? "pb-3" : undefined}>
              <BubbleContent>{variant === "ghost" ? "Ghost is useful for rich assistant output that should not look boxed in." : "Aurora bubble presentation can change without changing the message model."}</BubbleContent>
              {variant === "tinted" ? (
                <BubbleReactions>
                  <Button type="button" variant="plain" size="unstyled" className="flex size-6 items-center justify-center rounded-full" aria-label="Like tinted bubble">
                    <ThumbsUp data-icon="inline-start" aria-hidden="true" />
                  </Button>
                </BubbleReactions>
              ) : null}
            </Bubble>
          </div>
        ))}
      </BubbleGroup>
    </div>
  )
}
