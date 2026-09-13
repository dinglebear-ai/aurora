import * as React from "react"
import { CircleCheck, CircleAlert, Clock3, ShieldCheck } from "lucide-react"
import { Button } from "@/registry/aurora/ui/button"

/** Server-renderable OAuth chrome. No scripts, event handlers or external assets. */
export function OAuthDocument({ state, title, message, actionUrl }: {
  state: "consent" | "success" | "error" | "expired"
  title: string
  message: string
  actionUrl?: string
}) {
  const Icon = { consent: ShieldCheck, success: CircleCheck, error: CircleAlert, expired: Clock3 }[state]
  return (
    <main className="aurora-page-shell aurora-oauth-document" data-state={state}>
      <section className="aurora-oauth-document-panel" aria-labelledby="oauth-title">
        <div className="aurora-oauth-document-heading">
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="aurora-text-eyebrow">Secure Authorization</span>
        </div>
        <h1 className="aurora-text-display-2" id="oauth-title">{title}</h1>
        <p className="aurora-text-body">{message}</p>
        {actionUrl && <Button asChild variant="aurora" size="lg" block>
          <a href={actionUrl} rel="noreferrer">Continue</a>
        </Button>}
      </section>
    </main>
  )
}
