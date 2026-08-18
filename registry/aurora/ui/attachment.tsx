import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/aurora/ui/button"

export type AttachmentState = "idle" | "uploading" | "processing" | "error" | "done"
export type AttachmentSize = "default" | "sm" | "xs"
export type AttachmentOrientation = "horizontal" | "vertical"

const attachmentVariants = cva(
  "aurora-chat-attachment group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap",
  {
    variants: {
      size: {
        default: "aurora-chat-attachment--default",
        sm: "aurora-chat-attachment--sm",
        xs: "aurora-chat-attachment--xs",
      },
      orientation: {
        horizontal: "aurora-chat-attachment--horizontal",
        vertical: "aurora-chat-attachment--vertical",
      },
    },
    defaultVariants: {
      size: "default",
      orientation: "horizontal",
    },
  }
)

function Attachment({
  className,
  state = "done",
  size = "default",
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & { state?: AttachmentState }) {
  return (
    <div
      data-slot="attachment"
      data-state={state}
      data-size={size}
      data-orientation={orientation}
      className={cn(attachmentVariants({ size, orientation }), className)}
      {...props}
    />
  )
}

const attachmentMediaVariants = cva(
  "aurora-chat-attachment__media relative flex aspect-square shrink-0 items-center justify-center overflow-hidden",
  {
    variants: {
      variant: {
        icon: "",
        image: "aurora-chat-attachment__media--image",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  }
)

function AttachmentMedia({
  className,
  variant = "icon",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants>) {
  return (
    <div
      data-slot="attachment-media"
      data-variant={variant}
      className={cn(attachmentMediaVariants({ variant }), className)}
      {...props}
    />
  )
}

function AttachmentContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn("aurora-chat-attachment__content max-w-full min-w-0 flex-1", className)}
      {...props}
    />
  )
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-title"
      className={cn("aurora-chat-attachment__title block max-w-full min-w-0 truncate", className)}
      {...props}
    />
  )
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="attachment-description"
      className={cn("aurora-chat-attachment__description block max-w-full min-w-0 truncate", className)}
      {...props}
    />
  )
}

function AttachmentActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-actions"
      className={cn("aurora-chat-attachment__actions relative z-20 flex shrink-0 items-center", className)}
      {...props}
    />
  )
}

function AttachmentAction({
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="attachment-action"
      variant={variant}
      size={size}
      className={cn("size-7 rounded-[8px]", className)}
      {...props}
    />
  )
}

function AttachmentTrigger({
  className,
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="attachment-trigger"
      type={asChild ? undefined : (type ?? "button")}
      className={cn("absolute inset-0 z-10 outline-none", className)}
      {...props}
    />
  )
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        "aurora-chat-attachment-group flex min-w-0 gap-3 overflow-x-auto overscroll-x-contain py-1",
        "snap-x snap-mandatory scroll-px-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
        className
      )}
      {...props}
    />
  )
}

export {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
  attachmentVariants,
}
