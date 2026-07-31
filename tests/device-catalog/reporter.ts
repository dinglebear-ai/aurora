import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter"

interface CatalogCheck {
  itemId: string
  profile: string
  readiness: string
  previewKind: string | null
  url: string
  warnings: Array<{ id: string; impact: string | null; nodes: number }>
  failures: string[]
  durationMs?: number
  status?: string
}

class DeviceCatalogReporter implements Reporter {
  private readonly checks: CatalogCheck[] = []

  onTestEnd(test: TestCase, result: TestResult) {
    const attachment = result.attachments.find((candidate) => candidate.name === "catalog-check" && candidate.body)
    if (!attachment?.body) return
    const check = JSON.parse(attachment.body.toString("utf8")) as CatalogCheck
    check.durationMs = result.duration
    check.status = result.status
    if (result.status !== "passed" && check.failures.length === 0) {
      check.failures.push(result.error?.message ?? test.title)
    }
    this.checks.push(check)
  }

  onEnd(result: FullResult) {
    const directory = resolve("outputs/device-catalog")
    mkdirSync(directory, { recursive: true })
    const failedChecks = this.checks.filter((check) => check.status !== "passed")
    const warningChecks = this.checks.filter((check) => check.warnings.length > 0)
    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      status: result.status,
      summary: {
        registryEntries: new Set(this.checks.map((check) => check.itemId)).size,
        viewportProfiles: new Set(this.checks.map((check) => check.profile)).size,
        totalChecks: this.checks.length,
        passed: this.checks.length - failedChecks.length,
        failed: failedChecks.length,
        warningChecks: warningChecks.length,
        accessibilityWarnings: this.checks.reduce((total, check) => total + check.warnings.length, 0),
      },
      profiles: Object.fromEntries(
        [...new Set(this.checks.map((check) => check.profile))].sort().map((profile) => {
          const checks = this.checks.filter((check) => check.profile === profile)
          return [profile, { total: checks.length, failed: checks.filter((check) => check.status !== "passed").length }]
        }),
      ),
      failures: failedChecks,
      warnings: warningChecks,
      checks: this.checks,
    }
    writeFileSync(resolve(directory, "report.json"), `${JSON.stringify(report, null, 2)}\n`)
    writeFileSync(resolve(directory, "report.md"), renderMarkdown(report))
    console.log(
      `Device catalog: ${report.summary.passed}/${report.summary.totalChecks} passed, ${report.summary.failed} failed, ${report.summary.warningChecks} checks with accessibility warnings.`,
    )
  }
}

function renderMarkdown(report: {
  generatedAt: string
  status: string
  summary: Record<string, number>
  profiles: Record<string, { total: number; failed: number }>
  failures: CatalogCheck[]
}) {
  const profileRows = Object.entries(report.profiles)
    .map(([profile, values]) => `| ${profile} | ${values.total} | ${values.failed} |`)
    .join("\n")
  const failureRows = report.failures.length === 0
    ? "No failed catalog checks.\n"
    : report.failures.map((check) => `- **${check.itemId} / ${check.profile}:** ${check.failures.join("; ")}`).join("\n") + "\n"
  return `# Aurora Device Catalog Report\n\nGenerated: ${report.generatedAt}\n\nStatus: **${report.status}**\n\n- Registry entries: ${report.summary.registryEntries}\n- Viewport checks: ${report.summary.totalChecks}\n- Passed: ${report.summary.passed}\n- Failed: ${report.summary.failed}\n- Checks with accessibility warnings: ${report.summary.warningChecks}\n- Accessibility warnings: ${report.summary.accessibilityWarnings}\n\n## Viewports\n\n| Profile | Checks | Failed |\n| --- | ---: | ---: |\n${profileRows}\n\n## Failures\n\n${failureRows}`
}

export default DeviceCatalogReporter
