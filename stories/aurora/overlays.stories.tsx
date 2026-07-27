import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { Button } from "@/registry/aurora/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/aurora/ui/alert-dialog"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/aurora/ui/dialog"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/aurora/ui/sheet"

const meta = {
  title: "Aurora UI/Overlays",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Modal, confirmation, and sheet surfaces with focus-managed Radix interactions.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Modal: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild><Button>Edit registry</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit registry</DialogTitle>
          <DialogDescription>Update the display name used across Aurora clients.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <label className="grid gap-2 aurora-text-label">
            Display name
            <input className="rounded-[8px] border border-[var(--aurora-border-default)] bg-[var(--aurora-control-surface)] px-3 py-2 text-[var(--aurora-text-primary)]" defaultValue="Aurora" />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Edit registry" }))
    await waitFor(() => expect(body.getByRole("dialog", { name: "Edit registry" })).toBeVisible())
  },
}

export const DestructiveConfirmation: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="destructive">Delete token set</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete token set?</AlertDialogTitle>
          <AlertDialogDescription>This removes the token set from every linked preview. This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep token set</AlertDialogCancel>
          <AlertDialogAction>Delete permanently</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Delete token set" }))
    await waitFor(() => expect(body.getByRole("alertdialog", { name: "Delete token set?" })).toBeVisible())
  },
}

export const SideSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild><Button variant="neutral">Open inspector</Button></SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Component inspector</SheetTitle>
          <SheetDescription>Review registry metadata before publishing.</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <div className="rounded-[8px] border border-[var(--aurora-border-default)] p-4">
            <div className="aurora-text-label">Component</div>
            <div className="aurora-text-section mt-1">Prompt Input</div>
          </div>
          <div className="rounded-[8px] border border-[var(--aurora-border-default)] p-4">
            <div className="aurora-text-label">Dependencies</div>
            <div className="aurora-text-body-sm mt-1 text-[var(--aurora-text-muted)]">Button, Textarea, Tooltip</div>
          </div>
        </SheetBody>
        <SheetFooter><Button>Publish</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Open inspector" }))
    await waitFor(() => expect(body.getByRole("dialog", { name: "Component inspector" })).toBeVisible())
  },
}
