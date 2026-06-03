import { z, type ZodTypeAny } from "zod/v3"
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

const RESOURCE_URI = "ui://anet-mcp-ui/app"

const inputSchema: ZodTypeAny = z
  .object({
    toolName: z
      .string()
      .optional()
      .describe("Tool name for UI routing (defaults to anet_report_search_input)."),
    placeholder: z
      .string()
      .optional()
      .describe("Placeholder shown inside the search input."),
    defaultQuery: z
      .string()
      .optional()
      .describe("Pre-filled query, e.g. inferred from earlier chat."),
    businessObject: z
      .record(z.unknown())
      .optional()
      .describe("ANET businessObject; cached and used as context for the results tool.")
  })
  .passthrough()

export function registerReportSearchInputTool(server: McpServer) {
  registerAppTool(
    server,
    "anet_report_search_input",
    {
      title: "ANET report search input",
      description:
        "Render an input UI where the user types a natural-language report search query. " +
        "On submit, the UI sends a follow-up message back to the assistant asking it to " +
        "call the report search results tool.",
      inputSchema,
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI
        }
      }
    },
    async (args?: Record<string, unknown>) => {
      console.log(
        "[anet_report_search_input] CALLED args=" +
          JSON.stringify(args).slice(0, 500)
      )
      const safe = args ?? {}
      const payload = {
        toolName: "anet_report_search_input",
        status: "rendered",
        rendered: true,
        awaitingUserInput: true,
        message:
          "The report search input UI is now displayed to the user. " +
          "The user will type their query and click Search. " +
          "When they submit, you will receive a new user message starting with [anet-search-submit] — only then should you act.",
        placeholder:
          typeof safe.placeholder === "string" ? safe.placeholder : null,
        defaultQuery:
          typeof safe.defaultQuery === "string" ? safe.defaultQuery : null,
        businessObject: safe.businessObject ?? null
      }

      return {
        structuredContent: payload,
        content: [
          {
            type: "text",
            text:
              "DONE. The report search input UI is rendered and visible. " +
              "The user will type their query and click Search inside the UI; the UI will then display results directly without involving you. " +
              "STOP calling tools. Calling anet_report_search_input again will not change anything — the UI is already shown. " +
              "Wait silently for the next user message."
          }
        ]
      }
    }
  )
}
