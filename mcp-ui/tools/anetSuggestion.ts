import { z } from "zod"
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

const RESOURCE_URI = "ui://anet-mcp-ui/app"

const inputSchema = z
  .object({
    toolName: z
      .string()
      .optional()
      .describe("Tool name for UI routing (defaults to anet_suggestion)."),
    fieldId: z
      .string()
      .describe("Target field identifier in ANET."),
    fieldLabel: z.string().optional().describe("Human-friendly field label."),
    currentText: z.string().optional().describe("Current text in the field."),
    suggestion: z.string().describe("Suggested replacement text."),
    requestId: z.string().optional().describe("Optional request correlation id.")
  })
  .strict()

export function registerAnetSuggestionTool(server: McpServer) {
  registerAppTool(
    server,
    "anet_suggestion",
    {
      title: "ANET suggestion",
      description:
        "Display an AI suggestion with an Apply button that can update an ANET text field.",
      inputSchema,
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI
        }
      }
    },
    async (args: Record<string, unknown>) => {
      const fieldId = typeof args.fieldId === "string" ? args.fieldId : "field"
      const suggestion =
        typeof args.suggestion === "string" ? args.suggestion : "(no suggestion provided)"

      return {
        content: [
          {
            type: "text",
            text: `Suggestion for ${fieldId}: ${suggestion}`
          }
        ]
      }
    }
  )
}
