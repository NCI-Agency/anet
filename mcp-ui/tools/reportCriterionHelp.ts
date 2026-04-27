import { z, type ZodTypeAny } from "zod/v3"
import { Agent, Runner, withTrace, setDefaultOpenAIKey } from "@openai/agents"
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { normalizeBusinessCtx } from "../src/guidance/reportCriteria.js"

const RESOURCE_URI = "ui://anet-mcp-ui/app"

const inputSchema: ZodTypeAny = z
  .object({
    fieldId: z
      .string()
      .describe("Field id (intent, reportText, keyOutcomes, nextSteps, or general)."),
    criterionId: z.string().describe("Criterion id from the guidance checklist."),
    criterionLabel: z.string().optional().describe("Human-readable criterion label."),
    currentText: z.string().optional().describe("Current text of the target field."),
    businessObject: z
      .record(z.unknown())
      .optional()
      .describe("Full ANET businessObject for additional report context.")
  })
  .passthrough()

let agentInstance: Agent | null = null
let runnerInstance: Runner | null = null

function getAgent() {
  if (agentInstance) return agentInstance

  const baseURL =
    process.env.ANET_AGENT_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    process.env.OPENAI_API_BASE ??
    ""
  const apiKey =
    process.env.ANET_AGENT_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.OPENAI_API_TOKEN ??
    ""
  const model =
    process.env.ANET_AGENT_MODEL ??
    process.env.OPENAI_MODEL ??
    process.env.ANET_MODEL ??
    ""

  if (!baseURL) throw new Error("Missing ANET_AGENT_BASE_URL (or OPENAI_BASE_URL).")
  if (!apiKey) throw new Error("Missing ANET_AGENT_API_KEY (or OPENAI_API_KEY).")
  if (!model) throw new Error("Missing ANET_AGENT_MODEL (or OPENAI_MODEL).")

  if (!process.env.OPENAI_BASE_URL) process.env.OPENAI_BASE_URL = baseURL
  if (!process.env.OPENAI_AGENTS_DISABLE_TRACING) {
    process.env.OPENAI_AGENTS_DISABLE_TRACING = "1"
  }
  setDefaultOpenAIKey(apiKey)

  agentInstance = new Agent({
    name: "ANET Report Criterion Helper",
    model,
    instructions:
      "You help users write better ANET engagement reports. " +
      "When asked to evaluate or assist with a specific writing-checklist criterion " +
      "for a specific report field, give concise, actionable guidance or a short " +
      "rewrite so the criterion is met. Keep responses under 120 words. " +
      "No preamble, no apologies, no restating the question."
  })

  if (!runnerInstance) {
    runnerInstance = new Runner({
      tracingDisabled: true,
      traceIncludeSensitiveData: false
    })
  }

  return agentInstance
}

export function registerReportCriterionHelpTool(server: McpServer) {
  registerAppTool(
    server,
    "anet_report_criterion_help",
    {
      title: "ANET report criterion help",
      description:
        "Generate targeted guidance for a single writing-checklist criterion on a given report field.",
      inputSchema,
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI
        }
      }
    },
    async (args?: Record<string, unknown>) => {
      const safe = args ?? {}
      const fieldId = typeof safe.fieldId === "string" ? safe.fieldId : ""
      const criterionId = typeof safe.criterionId === "string" ? safe.criterionId : ""
      const criterionLabel =
        typeof safe.criterionLabel === "string" ? safe.criterionLabel : criterionId
      const currentText =
        typeof safe.currentText === "string" ? safe.currentText : undefined
      const ctx = normalizeBusinessCtx(safe.businessObject)

      if (!fieldId || !criterionId) {
        return {
          isError: true,
          content: [{ type: "text", text: "Missing fieldId or criterionId." }]
        }
      }

      const contextLines = [
        `Field: ${fieldId}`,
        `Criterion: ${criterionLabel}`,
        currentText
          ? `Current text:\n"""\n${currentText}\n"""`
          : "Current text: (empty)",
        ctx.intent ? `Engagement Purpose: ${ctx.intent}` : "",
        ctx.description ? `Engagement Details: ${ctx.description}` : "",
        ctx.keyOutcomes ? `Key Outcomes: ${ctx.keyOutcomes}` : "",
        ctx.nextSteps ? `Next Steps: ${ctx.nextSteps}` : "",
        ctx.attendees?.length ? `Attendees: ${ctx.attendees.join(", ")}` : "",
        ctx.tasks?.length ? `Tasks: ${ctx.tasks.join(", ")}` : "",
        ctx.location ? `Location: ${ctx.location}` : ""
      ].filter(Boolean)

      const prompt =
        "Help the user satisfy the following ANET report writing criterion.\n\n" +
        contextLines.join("\n") +
        "\n\nReturn a short, actionable suggestion or a proposed rewrite that meets the criterion."

      try {
        const agent = getAgent()
        const runner = runnerInstance ?? new Runner({ tracingDisabled: true })
        runnerInstance = runner
        const result = await withTrace("anet-report-criterion-help", () =>
          runner.run(agent, prompt)
        )
        const text =
          typeof result.finalOutput === "string"
            ? result.finalOutput.trim()
            : JSON.stringify(result.finalOutput ?? "")

        if (!text) {
          return {
            isError: true,
            content: [{ type: "text", text: "Agent returned an empty response." }]
          }
        }

        return {
          structuredContent: { fieldId, criterionId, text },
          content: [{ type: "text", text }]
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown agent execution error."
        return {
          isError: true,
          content: [{ type: "text", text: `Agent error: ${message}` }]
        }
      }
    }
  )
}
