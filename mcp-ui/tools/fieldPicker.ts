import { z, type ZodTypeAny } from "zod/v3"
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

const RESOURCE_URI = "ui://anet-mcp-ui/app"

const fieldSchema = z.object({
  id: z.string().describe("Field id (e.g., nextSteps, keyOutcomes, intent)"),
  label: z.string().describe("Field label to display"),
  description: z.string().optional().describe("Optional helper text"),
  currentText: z
    .string()
    .optional()
    .describe("Optional current text for the field (used to request a better suggestion).")
})

const inputSchema: ZodTypeAny = z
  .object({
    toolName: z
      .string()
      .optional()
      .describe("Tool name for UI routing (defaults to anet_field_picker)."),
    fields: z.union([z.array(fieldSchema), z.string()]).optional()
  })
  .passthrough()

export function registerFieldPickerTool(server: McpServer) {
  registerAppTool(
    server,
    "anet_field_picker",
    {
      title: "ANET field picker",
      description: "Display a list of fields to choose from before requesting suggestions.",
      inputSchema,
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI
        }
      }
    },
    async () => ({
      content: [
        {
          type: "text",
          text: "Choose a field."
        }
      ]
    })
  )
}
