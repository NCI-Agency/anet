import { z, type ZodTypeAny } from "zod/v3"
import { Agent, Runner, withTrace, setDefaultOpenAIKey } from "@openai/agents"
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

const RESOURCE_URI = "ui://anet-mcp-ui/app"

const inputSchema: ZodTypeAny = z
  .object({
    toolName: z
      .string()
      .optional()
      .describe("Tool name for UI routing (defaults to anet_agent_suggestion)."),
    fieldId: z.string().describe("Target field identifier in ANET."),
    fieldLabel: z.string().optional().describe("Human-friendly field label."),
    currentText: z.string().optional().describe("Current text in the field."),
    guidance: z.string().optional().describe("Optional extra guidance for the rewrite.")
  })
  .strict()

let agentInstance: Agent | null = null
let runnerInstance: Runner | null = null

function getAgent() {
  if (agentInstance) {
    return agentInstance
  }

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

  if (!baseURL) {
    throw new Error("Missing ANET_AGENT_BASE_URL (or OPENAI_BASE_URL).")
  }
  if (!apiKey) {
    throw new Error("Missing ANET_AGENT_API_KEY (or OPENAI_API_KEY).")
  }
  if (!model) {
    throw new Error("Missing ANET_AGENT_MODEL (or OPENAI_MODEL).")
  }

  if (!process.env.OPENAI_BASE_URL) {
    process.env.OPENAI_BASE_URL = baseURL
  }
  if (!process.env.OPENAI_AGENTS_DISABLE_TRACING) {
    process.env.OPENAI_AGENTS_DISABLE_TRACING = "1"
  }
  setDefaultOpenAIKey(apiKey)

  agentInstance = new Agent({
    name: "ANET Suggestion Agent",
    model,
    instructions:
      "You are an assistant for ANET. Improve the provided field text. " +
      "Return only the improved text. Do not include explanations, formatting, or quotes."
  })

  if (!runnerInstance) {
    runnerInstance = new Runner({
      tracingDisabled: true,
      traceIncludeSensitiveData: false
    })
  }

  return agentInstance
}

export function registerAgentSuggestionTool(server: McpServer) {
  registerAppTool(
    server,
    "anet_agent_suggestion",
    {
      title: "ANET suggestion (agent)",
      description:
        "Generate an improved suggestion using the Agents SDK and return it for ANET UI.",
      inputSchema,
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI
        }
      }
    },
    async (args?: Record<string, unknown>) => {
      const safeArgs = args ?? {}
      const fieldId = typeof safeArgs.fieldId === "string" ? safeArgs.fieldId : ""
      const fieldLabel =
        typeof safeArgs.fieldLabel === "string" ? safeArgs.fieldLabel : undefined
      const currentText =
        typeof safeArgs.currentText === "string" ? safeArgs.currentText : undefined
      const guidance =
        typeof safeArgs.guidance === "string" ? safeArgs.guidance : undefined

      if (!fieldId) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Missing fieldId."
            }
          ]
        }
      }

      const label = fieldLabel ?? fieldId
      const currentBlock = currentText
        ? `\n\nCurrent text:\n"""\n${currentText}\n"""`
        : ""
      const guidanceBlock = guidance ? `\n\nGuidance:\n${guidance}` : ""

      const prompt =
        `Improve the ANET field "${label}" (fieldId: ${fieldId}).` +
        currentBlock +
        guidanceBlock

      try {
        const agent = getAgent()
        const runner = runnerInstance ?? new Runner({ tracingDisabled: true })
        runnerInstance = runner
        const result = await withTrace("anet-agent-suggestion", () =>
          runner.run(agent, prompt)
        )
        const suggestion =
          typeof result.finalOutput === "string"
            ? result.finalOutput.trim()
            : JSON.stringify(result.finalOutput ?? "")

        if (!suggestion) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Agent returned an empty suggestion."
              }
            ]
          }
        }

        const payload = {
          fieldId,
          fieldLabel,
          currentText,
          suggestion
        }

        return {
          structuredContent: payload,
          content: [
            {
              type: "text",
              text: `ANET_SUGGESTION_JSON:${JSON.stringify(payload)}`
            }
          ]
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown agent execution error."
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Agent error: ${message}`
            }
          ]
        }
      }
    }
  )
}
