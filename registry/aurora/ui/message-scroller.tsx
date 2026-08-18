"use client"

import * as React from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, type ButtonSize, type ButtonVariant } from "@/registry/aurora/ui/button"

type ScrollDirection = "start" | "end"

type ScrollOptions = {
  behavior?: ScrollBehavior
}

type MessageScrollOptions = ScrollOptions & {
  block?: "start" | "center" | "end"
}

type MessageScrollerContextValue = {
  viewport: HTMLDivElement | null
  content: HTMLDivElement | null
  setViewport: (node: HTMLDivElement | null) => void
  setContent: (node: HTMLDivElement | null) => void
  registerItem: (messageId: string, node: HTMLElement | null) => void
  onViewportScroll: () => void
  onUserScrollIntent: () => void
  scrollTo: (direction: ScrollDirection, options?: ScrollOptions) => void
  scrollToMessage: (messageId: string, options?: MessageScrollOptions) => void
  isAtStart: boolean
  isAtEnd: boolean
  isScrollable: boolean
  isAutoScrolling: boolean
  scrollPreviousItemPeek: number
}

const MessageScrollerContext = React.createContext<MessageScrollerContextValue | null>(null)

export interface MessageScrollerProviderProps {
  children: React.ReactNode
  /** Follow content growth while the reader remains pinned to the end. */
  autoScroll?: boolean
  /** Pixels of the previous turn left visible when an anchored message is revealed. */
  scrollPreviousItemPeek?: number
}

function useMessageScrollerContext() {
  const value = React.useContext(MessageScrollerContext)
  if (!value) {
    throw new Error("MessageScroller components must be wrapped in MessageScrollerProvider")
  }
  return value
}

function MessageScrollerProvider({
  children,
  autoScroll = true,
  scrollPreviousItemPeek = 48,
}: MessageScrollerProviderProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const [viewport, setViewportNode] = React.useState<HTMLDivElement | null>(null)
  const [content, setContentNode] = React.useState<HTMLDivElement | null>(null)
  const [isAtStart, setIsAtStart] = React.useState(true)
  const [isAtEnd, setIsAtEnd] = React.useState(true)
  const [isScrollable, setIsScrollable] = React.useState(false)
  const [isAutoScrolling, setIsAutoScrolling] = React.useState(false)
  const itemsRef = React.useRef(new Map<string, HTMLElement>())
  const followEndRef = React.useRef(true)
  const programmaticRef = React.useRef(false)
  const autoScrollTimerRef = React.useRef<number | null>(null)
  const previousHeightRef = React.useRef(0)

  const setViewport = React.useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node
    setViewportNode(node)
  }, [])

  const setContent = React.useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node
    setContentNode(node)
  }, [])

  const updateMetrics = React.useCallback(() => {
    const viewportNode = viewportRef.current
    if (!viewportNode) return
    const tolerance = 3
    const scrollable = viewportNode.scrollHeight > viewportNode.clientHeight + tolerance
    const atStart = viewportNode.scrollTop <= tolerance
    const atEnd = viewportNode.scrollHeight - viewportNode.clientHeight - viewportNode.scrollTop <= tolerance

    setIsScrollable(scrollable)
    setIsAtStart(atStart)
    setIsAtEnd(atEnd)
    if (atEnd) followEndRef.current = true
  }, [])

  const markProgrammaticScroll = React.useCallback(() => {
    programmaticRef.current = true
    setIsAutoScrolling(true)
    if (autoScrollTimerRef.current != null) window.clearTimeout(autoScrollTimerRef.current)
    autoScrollTimerRef.current = window.setTimeout(() => {
      programmaticRef.current = false
      setIsAutoScrolling(false)
      autoScrollTimerRef.current = null
    }, 240)
  }, [])

  const scrollTo = React.useCallback(
    (direction: ScrollDirection, options: ScrollOptions = {}) => {
      const viewportNode = viewportRef.current
      if (!viewportNode) return
      const behavior = options.behavior ?? "smooth"
      markProgrammaticScroll()
      followEndRef.current = direction === "end"
      viewportNode.scrollTo({
        top: direction === "end" ? viewportNode.scrollHeight : 0,
        behavior,
      })
    },
    [markProgrammaticScroll]
  )

  const scrollToMessage = React.useCallback(
    (messageId: string, options: MessageScrollOptions = {}) => {
      const viewportNode = viewportRef.current
      if (!viewportNode) return
      const node = itemsRef.current.get(messageId)
      if (!node) return

      const block = options.block ?? "start"
      const peek = block === "start" ? scrollPreviousItemPeek : 0
      let top = node.offsetTop - peek
      if (block === "center") top = node.offsetTop - (viewportNode.clientHeight - node.offsetHeight) / 2
      if (block === "end") top = node.offsetTop - viewportNode.clientHeight + node.offsetHeight

      markProgrammaticScroll()
      followEndRef.current = false
      viewportNode.scrollTo({ top: Math.max(0, top), behavior: options.behavior ?? "smooth" })
    },
    [markProgrammaticScroll, scrollPreviousItemPeek]
  )

  const registerItem = React.useCallback((messageId: string, node: HTMLElement | null) => {
    if (!node) {
      itemsRef.current.delete(messageId)
      return
    }

    const isNew = !itemsRef.current.has(messageId)
    itemsRef.current.set(messageId, node)
    const viewportNode = viewportRef.current

    // If history is prepended while the reader is away from the end, preserve
    // the visible anchor by compensating for the newly inserted row height.
    if (isNew && viewportNode && !followEndRef.current && viewportNode.scrollTop > 0 && node.offsetTop < viewportNode.scrollTop) {
      viewportNode.scrollTop += node.offsetHeight
    }
  }, [])

  const onUserScrollIntent = React.useCallback(() => {
    followEndRef.current = false
    programmaticRef.current = false
    setIsAutoScrolling(false)
    if (autoScrollTimerRef.current != null) {
      window.clearTimeout(autoScrollTimerRef.current)
      autoScrollTimerRef.current = null
    }
  }, [])

  const onViewportScroll = React.useCallback(() => {
    const viewportNode = viewportRef.current
    if (!viewportNode) return
    const tolerance = 3
    const atEnd = viewportNode.scrollHeight - viewportNode.clientHeight - viewportNode.scrollTop <= tolerance
    if (!programmaticRef.current && !atEnd) followEndRef.current = false
    updateMetrics()
  }, [updateMetrics])

  React.useLayoutEffect(() => {
    const viewportNode = viewportRef.current
    const contentNode = contentRef.current
    if (!viewport || !content || !viewportNode || !contentNode) return

    viewportNode.scrollTop = viewportNode.scrollHeight
    followEndRef.current = true
    updateMetrics()
    previousHeightRef.current = contentNode.scrollHeight

    const observer = new ResizeObserver(() => {
      const nextHeight = contentNode.scrollHeight
      const grew = nextHeight > previousHeightRef.current
      previousHeightRef.current = nextHeight

      if (autoScroll && grew && followEndRef.current) {
        markProgrammaticScroll()
        viewportNode.scrollTo({ top: viewportNode.scrollHeight, behavior: "smooth" })
      }
      window.requestAnimationFrame(updateMetrics)
    })

    observer.observe(contentNode)
    observer.observe(viewportNode)
    return () => observer.disconnect()
  }, [autoScroll, content, markProgrammaticScroll, updateMetrics, viewport])

  React.useEffect(() => {
    return () => {
      if (autoScrollTimerRef.current != null) window.clearTimeout(autoScrollTimerRef.current)
    }
  }, [])

  const value = React.useMemo<MessageScrollerContextValue>(
    () => ({
      viewport,
      content,
      setViewport,
      setContent,
      registerItem,
      onViewportScroll,
      onUserScrollIntent,
      scrollTo,
      scrollToMessage,
      isAtStart,
      isAtEnd,
      isScrollable,
      isAutoScrolling,
      scrollPreviousItemPeek,
    }),
    [
      viewport,
      content,
      registerItem,
      onViewportScroll,
      onUserScrollIntent,
      scrollTo,
      scrollToMessage,
      isAtStart,
      isAtEnd,
      isScrollable,
      isAutoScrolling,
      scrollPreviousItemPeek,
    ]
  )

  return <MessageScrollerContext.Provider value={value}>{children}</MessageScrollerContext.Provider>
}

function MessageScroller({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-scroller"
      className={cn("aurora-message-scroller relative flex size-full min-h-0 flex-col overflow-hidden", className)}
      {...props}
    />
  )
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) (ref as React.MutableRefObject<T | null>).current = value
}

function MessageScrollerViewport({
  className,
  ref,
  onScroll,
  onWheel,
  onTouchMove,
  onKeyDown,
  onPointerDown,
  ...props
}: React.ComponentProps<"div"> & { ref?: React.Ref<HTMLDivElement> }) {
  const { setViewport, isAtStart, isAtEnd, isAutoScrolling, onViewportScroll, onUserScrollIntent } = useMessageScrollerContext()
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setViewport(node)
      assignRef(ref, node)
    },
    [ref, setViewport]
  )

  return (
    <div
      ref={setRef}
      data-slot="message-scroller-viewport"
      data-at-start={isAtStart ? "true" : "false"}
      data-at-end={isAtEnd ? "true" : "false"}
      data-autoscrolling={isAutoScrolling ? "true" : "false"}
      role={props.role ?? "region"}
      aria-label={props["aria-label"] ?? "Message history"}
      tabIndex={props.tabIndex ?? 0}
      className={cn(
        "aurora-message-scroller__viewport size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain",
        className
      )}
      onScroll={(event) => {
        onViewportScroll()
        onScroll?.(event)
      }}
      onWheel={(event) => {
        onUserScrollIntent()
        onWheel?.(event)
      }}
      onTouchMove={(event) => {
        onUserScrollIntent()
        onTouchMove?.(event)
      }}
      onKeyDown={(event) => {
        if (["ArrowUp", "PageUp", "Home"].includes(event.key)) onUserScrollIntent()
        onKeyDown?.(event)
      }}
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onUserScrollIntent()
        onPointerDown?.(event)
      }}
      {...props}
    />
  )
}

function MessageScrollerContent({
  className,
  ref,
  ...props
}: React.ComponentProps<"div"> & { ref?: React.Ref<HTMLDivElement> }) {
  const { setContent } = useMessageScrollerContext()
  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setContent(node)
      assignRef(ref, node)
    },
    [ref, setContent]
  )

  return (
    <div
      ref={setRef}
      data-slot="message-scroller-content"
      role={props.role ?? "log"}
      aria-live={props["aria-live"] ?? "polite"}
      aria-relevant={props["aria-relevant"] ?? "additions text"}
      className={cn("flex h-max min-h-full flex-col gap-7", className)}
      {...props}
    />
  )
}

export interface MessageScrollerItemProps extends React.ComponentProps<"div"> {
  messageId?: string
  scrollAnchor?: boolean
}

function MessageScrollerItem({
  className,
  ref,
  messageId,
  scrollAnchor = false,
  ...props
}: MessageScrollerItemProps & { ref?: React.Ref<HTMLDivElement> }) {
  const { registerItem, scrollToMessage } = useMessageScrollerContext()
  const reactId = React.useId()
  const id = messageId ?? reactId

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      registerItem(id, node)
      assignRef(ref, node)
    },
    [id, ref, registerItem]
  )

  React.useLayoutEffect(() => {
    if (!scrollAnchor) return
    scrollToMessage(id, { block: "start", behavior: "smooth" })
  }, [id, scrollAnchor, scrollToMessage])

  React.useEffect(() => () => registerItem(id, null), [id, registerItem])

  return (
    <div
      ref={setRef}
      data-slot="message-scroller-item"
      data-message-id={id}
      data-scroll-anchor={scrollAnchor ? "true" : "false"}
      className={cn(
        "min-w-0 shrink-0 [contain-intrinsic-size:auto_10rem] [content-visibility:auto]",
        className
      )}
      {...props}
    />
  )
}

export interface MessageScrollerButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "size" | "variant"> {
  direction?: ScrollDirection
  variant?: ButtonVariant
  size?: ButtonSize
}

function MessageScrollerButton({
  direction = "end",
  className,
  children,
  variant = "neutral",
  size = "icon",
  onClick,
  tabIndex,
  ...props
}: MessageScrollerButtonProps) {
  const context = useMessageScrollerContext()
  const active = context.isScrollable && (direction === "end" ? !context.isAtEnd : !context.isAtStart)
  const Icon = direction === "end" ? ArrowDown : ArrowUp

  return (
    <Button
      data-slot="message-scroller-button"
      data-direction={direction}
      data-active={active ? "true" : "false"}
      variant={variant}
      size={size}
      className={cn("aurora-message-scroller__button", className)}
      aria-hidden={!active}
      tabIndex={active ? tabIndex : -1}
      {...props}
      onClick={(event) => {
        context.scrollTo(direction)
        onClick?.(event)
      }}
    >
      {children ?? (
        <>
          <Icon data-icon="inline-start" aria-hidden="true" />
          <span className="sr-only">{direction === "end" ? "Scroll to end" : "Scroll to start"}</span>
        </>
      )}
    </Button>
  )
}

function useMessageScroller() {
  const context = useMessageScrollerContext()
  return {
    scrollToStart: (options?: ScrollOptions) => context.scrollTo("start", options),
    scrollToEnd: (options?: ScrollOptions) => context.scrollTo("end", options),
    scrollToMessage: context.scrollToMessage,
    viewport: context.viewport,
    isAtStart: context.isAtStart,
    isAtEnd: context.isAtEnd,
    isAutoScrolling: context.isAutoScrolling,
  }
}

function useMessageScrollerScrollable() {
  return useMessageScrollerContext().isScrollable
}

function useMessageScrollerVisibility() {
  const { isAtStart, isAtEnd } = useMessageScrollerContext()
  return { isAtStart, isAtEnd }
}

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
}
