"use client"

import * as React from "react"
import { Check, CodeXml, Copy } from "lucide-react"
import { Badge } from "@/registry/aurora/ui/badge"
import { Button } from "@/registry/aurora/ui/button"
import { useClipboard } from "@/registry/aurora/lib/use-clipboard"

export interface SnippetProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string
  /** Short language identifier shown in the header chip (e.g. "ts", "tsx", "py"). */
  language?: string
  /** Compact density for embedding snippets inside chat turns. */
  density?: "default" | "compact"
}

/**
 * Lightweight token highlighter that reproduces the Claude Design Snippet
 * coloring: keywords in rose, member/function calls in cyan, numbers in orange,
 * strings in success-teal, everything else in primary text. Deliberately simple
 * (no external grammar) so it stays in sync with the registry token palette.
 */
const KEYWORDS = new Set([
  "export",
  "import",
  "from",
  "default",
  "const",
  "let",
  "var",
  "function",
  "async",
  "await",
  "return",
  "if",
  "else",
  "for",
  "while",
  "new",
  "class",
  "extends",
  "typeof",
  "in",
  "of",
  "yield",
  "try",
  "catch",
  "finally",
  "throw",
  "def",
  "lambda",
  "true",
  "false",
  "null",
  "undefined",
  "None",
  "True",
  "False",
])

const TOKEN_RE =
  /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\s\w$])/g

function tokenColor(word: string, prevSig: string, nextSig: string): string | undefined {
  if (KEYWORDS.has(word)) return "var(--aurora-accent-pink)"
  // member access (foo.bar) or call (bar(...)) → cyan identifier
  if (prevSig === "." || nextSig === "(") return "var(--aurora-accent-primary)"
  return undefined
}

function highlight(code: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let match: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  let key = 0
  // Track the last non-whitespace token to resolve member-access / call coloring.
  let prevSig = ""
  // Pre-scan to know the "next significant" char for each identifier.
  const tokens: { text: string; type: number }[] = []
  while ((match = TOKEN_RE.exec(code)) !== null) {
    if (match[1]) tokens.push({ text: match[1], type: 1 })
    else if (match[2]) tokens.push({ text: match[2], type: 2 })
    else if (match[3]) tokens.push({ text: match[3], type: 3 })
    else if (match[4]) tokens.push({ text: match[4], type: 4 })
    else if (match[5]) tokens.push({ text: match[5], type: 5 })
    else tokens.push({ text: match[6] ?? "", type: 6 })
  }
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i]
    if (t.type === 5) {
      out.push(<React.Fragment key={key++}>{t.text}</React.Fragment>)
      continue
    }
    let color: string | undefined
    if (t.type === 1) color = "var(--aurora-text-muted)"
    else if (t.type === 2) color = "var(--aurora-success)"
    else if (t.type === 3) color = "var(--axon-orange)"
    else if (t.type === 4) {
      let j = i + 1
      while (j < tokens.length && tokens[j].type === 5) j += 1
      const nextSig = j < tokens.length ? tokens[j].text : ""
      color = tokenColor(t.text, prevSig, nextSig)
    }
    if (t.type !== 5) prevSig = t.text.trim() ? t.text : prevSig
    out.push(
      <span key={key++} style={color ? { color } : undefined}>
        {t.text}
      </span>
    )
  }
  return out
}

function CopyIconButton({ value, compact = false }: { value: string; compact?: boolean }) {
  const { copied, error, copy } = useClipboard(1200)
  const handleCopy = React.useCallback(() => void copy(value), [copy, value])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={compact ? "!size-6 [&_svg]:!size-3.5" : undefined}
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : error ? "Unable to copy code" : "Copy code"}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {copied ? "Copied" : error ? "Unable to copy" : "Copy code"}
      </span>
    </Button>
  )
}

/**
 * Snippet — a recessed code surface with a language chip and an icon-only copy
 * control, matching the Claude Design AI-element spec. Keeps the registry
 * architecture: `forwardRef` to the underlying `<pre>`, `displayName`, full
 * prop spread, and an accessible copy affordance.
 */
const Snippet = ({ ref, code, language = "tsx", density = "default", className, style, tabIndex, ...props }: SnippetProps & { ref?: React.Ref<HTMLPreElement> }) => {
  const compact = density === "compact"
  return (
    <div
      className={className}
      style={{
        background: compact ? "color-mix(in srgb, var(--aurora-panel-strong) 92%, transparent)" : "var(--aurora-panel-strong)",
        border: "1px solid var(--aurora-border-default)",
        borderRadius: compact ? "10px" : "var(--aurora-radius-2)",
        boxShadow: compact ? "var(--aurora-highlight-medium)" : "var(--aurora-shadow-medium), var(--aurora-highlight-medium)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        className="flex items-center justify-between gap-3"
        style={{
          padding: compact ? "6px 8px" : "12px 14px",
          borderBottom: "1px solid var(--aurora-border-default)",
          background: compact
            ? "color-mix(in srgb, var(--aurora-panel-medium) 52%, transparent)"
            : "linear-gradient(180deg, color-mix(in srgb, var(--aurora-panel-strong-top) 70%, transparent), transparent)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <CodeXml className={compact ? "size-3.5" : "size-4"} aria-hidden style={{ color: "var(--aurora-text-muted)" }} />
          <Badge tone="rose" size="sm">
            {language}
          </Badge>
        </div>
        <CopyIconButton value={code} compact={compact} />
      </div>
      <pre
        ref={ref}
        tabIndex={tabIndex ?? 0}
        className="overflow-auto aurora-text-code"
        style={{
          margin: 0,
          padding: compact ? "8px 10px" : "16px 18px",
          background: "transparent",
          color: "var(--aurora-text-primary)",
          fontSize: compact ? "12px" : undefined,
          lineHeight: compact ? 1.5 : 1.7,
          whiteSpace: "pre",
        }}
        {...props}
      >
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}
Snippet.displayName = "Snippet"

export { Snippet }
