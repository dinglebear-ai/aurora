"use client"

import type { ComponentType } from "react"
import { CircleAlert, CircleCheck, Download, Info, MoreHorizontal, Save, Search, Settings, Sparkles } from "lucide-react"

import { Accordion, AccordionItem } from "@/registry/aurora/ui/accordion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/registry/aurora/ui/alert-dialog"
import { Badge } from "@/registry/aurora/ui/badge"
import { Button } from "@/registry/aurora/ui/button"
import { Callout } from "@/registry/aurora/ui/callout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/aurora/ui/card"
import { Collapsible } from "@/registry/aurora/ui/collapsible"
import { Combobox } from "@/registry/aurora/ui/combobox"
import { DescriptionItem, DescriptionList } from "@/registry/aurora/ui/description-list"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/registry/aurora/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@/registry/aurora/ui/dropdown-menu"
import { Input } from "@/registry/aurora/ui/input"
import { Label } from "@/registry/aurora/ui/label"
import { MultiSelect } from "@/registry/aurora/ui/multi-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/aurora/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/registry/aurora/ui/radio-group"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/registry/aurora/ui/sheet"
import { StatusIndicator } from "@/registry/aurora/ui/status-indicator"
import { Stepper } from "@/registry/aurora/ui/stepper"
import { Switch } from "@/registry/aurora/ui/switch"
import { PillGroup, PillTrigger, TabsContent } from "@/registry/aurora/ui/tabs"
import { Textarea } from "@/registry/aurora/ui/textarea"
import { Timeline, TimelineItem } from "@/registry/aurora/ui/timeline"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/aurora/ui/tooltip"

export type FixtureId = "button" | "card" | "feedback" | "forms" | "progress" | "disclosure" | "overlays" | "widgets"

export const fixtureRenderers: Readonly<Record<FixtureId, ComponentType>> = {
  button: ButtonFixture,
  card: CardFixture,
  feedback: FeedbackFixture,
  forms: FormsFixture,
  progress: ProgressFixture,
  disclosure: DisclosureFixture,
  overlays: OverlaysFixture,
  widgets: WidgetsFixture,
}

export function ButtonFixture() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Button variant="aurora">Aurora</Button><Button variant="neutral">Neutral</Button><Button variant="rose">Rose</Button>
        <Button variant="success">Success</Button><Button variant="warn">Warn</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" iconLeft={<Save data-icon="inline-start" aria-hidden />}>Save</Button>
        <Button iconLeft={<Download data-icon="inline-start" aria-hidden />}>Export</Button>
        <Button size="lg" variant="aurora" iconLeft={<Settings data-icon="inline-start" aria-hidden />}>Configure</Button>
        <Button size="icon" aria-label="Settings" iconLeft={<Settings aria-hidden />} />
        <Button loading>Loading</Button><Button disabled>Disabled</Button>
      </div>
    </div>
  )
}

export function CardFixture() {
  return (
    <Card className="w-full max-w-[520px]" accent="cyan" elevated>
      <CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>Aurora registry</CardTitle><CardDescription>Canonical React components ready for every Tauri target.</CardDescription></div><Badge tone="info" dot>Live</Badge></div></CardHeader>
      <CardContent className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-3"><Metric label="Items" value="176" /><Metric label="UI" value="79" /><Metric label="Blocks" value="73" /></div><StatusIndicator tone="automating" label="Device catalog generated" /></CardContent>
      <CardFooter className="flex justify-end gap-2"><Button variant="ghost">View docs</Button><Button>Install</Button></CardFooter>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[8px] border border-[var(--aurora-border-default)] bg-[var(--aurora-control-surface)] p-3"><div className="aurora-text-label">{label}</div><div className="mt-1 text-2xl font-semibold text-[var(--aurora-text-primary)]">{value}</div></div>
}

export function FeedbackFixture() {
  return (
    <div className="flex w-full max-w-[640px] flex-col gap-5">
      <div className="flex flex-wrap gap-3"><Badge tone="info" dot>Info</Badge><Badge tone="success" dot pulse>Success</Badge><Badge tone="warn" dot>Warn</Badge><Badge tone="error" dot>Error</Badge><Badge tone="rose" shape="pill">Agent</Badge></div>
      <div className="grid gap-3"><StatusIndicator tone="online" label="Registry online" /><StatusIndicator tone="syncing" label="Syncing tokens" /><StatusIndicator tone="degraded" label="Preview needs mobile review" /></div>
      <div className="grid gap-3"><Callout variant="success" title="Build passed" icon={<CircleCheck aria-hidden />}>The real registry source rendered in the device catalog.</Callout><Callout variant="warn" title="Review touch behavior" icon={<CircleAlert aria-hidden />}>Use the phone viewport and Android app before publishing.</Callout><Callout variant="info" title="Shared fixture" icon={<Sparkles aria-hidden />}>This surface is reusable by Storybook and Tauri.</Callout></div>
    </div>
  )
}

export function FormsFixture() {
  return (
    <div className="grid w-full max-w-[560px] gap-5">
      <Label className="grid gap-2"><span>Search registry</span><Input startAdornment={<Search aria-hidden />} placeholder="button, dialog, workspace..." /></Label>
      <div className="grid gap-3 sm:grid-cols-3"><Input size="sm" placeholder="Small" /><Input placeholder="Default" /><Input size="lg" placeholder="Large" /></div>
      <div className="grid gap-3 sm:grid-cols-3"><Input aria-label="Success state" state="success" defaultValue="Published" /><Input aria-label="Warning state" state="warn" defaultValue="Needs review" /><Input aria-label="Error state" state="error" defaultValue="Invalid token" /></div>
      <Label className="grid gap-2"><span>Release notes</span><Textarea defaultValue="Adds cross-platform catalog coverage for Aurora." /></Label>
      <div className="flex items-center justify-between gap-4"><Label htmlFor="mobile-a11y">Mobile accessibility checks</Label><Switch id="mobile-a11y" defaultChecked /></div>
      <PillGroup defaultValue="registry" panels={<><TabsContent value="registry">Registry previews</TabsContent><TabsContent value="device">Device previews</TabsContent><TabsContent value="capabilities">Capability previews</TabsContent></>}><PillTrigger value="registry">Registry</PillTrigger><PillTrigger value="device">Devices</PillTrigger><PillTrigger value="capabilities">Capabilities</PillTrigger></PillGroup>
    </div>
  )
}

export function ProgressFixture() {
  return (
    <div className="flex w-full max-w-[760px] flex-col gap-6">
      <DescriptionList><DescriptionItem label="Registry item" value="aurora-prompt-input" active /><DescriptionItem label="Type" value={<Badge tone="info">Block</Badge>} /><DescriptionItem label="Status" value={<Badge tone="success" dot>Published</Badge>} /></DescriptionList>
      <Timeline><TimelineItem tone="online" title="Registry generated" meta="Complete">All 176 items are indexed.</TimelineItem><TimelineItem tone="automating" title="Mobile checks running" meta="Active">Browser and Tauri fixtures are loading lazily.</TimelineItem><TimelineItem tone="queued" title="Android verification" meta="Queued">Install the APK through claude-in-mobile.</TimelineItem></Timeline>
      <Stepper current={2} steps={[{ label: "Compose", description: "Build the component" },{ label: "Validate", description: "Run contracts" },{ label: "Preview", description: "Review devices" },{ label: "Publish", description: "Promote artifacts" }]} />
    </div>
  )
}

export function DisclosureFixture() {
  return (
    <div className="flex w-full max-w-[620px] flex-col gap-6">
      <Accordion type="single" defaultValue="install"><AccordionItem value="install" title="Install Aurora" meta="Recommended">Add the registry URL, then install any primitive with the shadcn CLI.</AccordionItem><AccordionItem value="mobile" title="Review mobile readiness">Check touch, overlays, keyboard, safe areas, and native bridge requirements.</AccordionItem></Accordion>
      <Collapsible title="Generated catalog artifacts" defaultOpen><ul className="grid gap-2"><li>catalog/inventory.json</li><li>catalog/fixtures.tsx</li><li>apps/device-catalog</li></ul></Collapsible>
      <div className="flex gap-3"><DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="Component actions"><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuLabel>Component actions</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem>Open preview<DropdownMenuShortcut>Enter</DropdownMenuShortcut></DropdownMenuItem><DropdownMenuItem>Copy install command<DropdownMenuShortcut>⌘C</DropdownMenuShortcut></DropdownMenuItem></DropdownMenuContent></DropdownMenu><TooltipProvider delayDuration={0}><Tooltip><TooltipTrigger asChild><Button variant="neutral">Hover or focus</Button></TooltipTrigger><TooltipContent>Registry checks passed</TooltipContent></Tooltip></TooltipProvider></div>
    </div>
  )
}

export function OverlaysFixture() {
  return (
    <div className="flex flex-wrap gap-3">
      <Dialog><DialogTrigger asChild><Button>Edit registry</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit registry</DialogTitle><DialogDescription>Update catalog metadata used across Aurora clients.</DialogDescription></DialogHeader><DialogBody><Label className="grid gap-2">Display name<Input defaultValue="Aurora" /></Label></DialogBody><DialogFooter><Button variant="ghost">Cancel</Button><Button>Save changes</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive">Delete draft</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete draft?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep draft</AlertDialogCancel><AlertDialogAction>Delete permanently</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <Sheet><SheetTrigger asChild><Button variant="neutral">Open inspector</Button></SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Component inspector</SheetTitle><SheetDescription>Review registry and mobile metadata.</SheetDescription></SheetHeader><SheetBody><Callout variant="info" title="Adaptive surface" icon={<Info aria-hidden />}>Sheets become a primary mobile composition.</Callout></SheetBody><SheetFooter><Button>Publish</Button></SheetFooter></SheetContent></Sheet>
    </div>
  )
}

export function WidgetsFixture() {
  return (
    <div className="grid w-full max-w-[520px] gap-5">
      <Combobox options={[{ value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta" }]} />
      <MultiSelect aria-label="Environments" options={[{ value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta" }]} />
      <RadioGroup defaultValue="alpha" aria-label="Agent"><RadioGroupItem value="alpha">Alpha</RadioGroupItem><RadioGroupItem value="beta">Beta</RadioGroupItem></RadioGroup>
      <Popover><PopoverTrigger>Open popover</PopoverTrigger><PopoverContent><Button>First action</Button></PopoverContent></Popover>
    </div>
  )
}
