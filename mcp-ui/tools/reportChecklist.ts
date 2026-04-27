import { z, type ZodTypeAny } from "zod/v3"
import { registerAppTool } from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import {
  buildChecklist,
  buildDynamicCriteria,
  DictionaryCriterion,
  normalizeBusinessCtx
} from "../src/guidance/reportCriteria.js"

const RESOURCE_URI = "ui://anet-mcp-ui/app"

const inputSchema: ZodTypeAny = z
  .object({
    toolName: z
      .string()
      .optional()
      .describe("Tool name for UI routing (defaults to anet_report_checklist)."),
    businessObject: z
      .record(z.unknown())
      .optional()
      .describe("ANET businessObject containing the current report fields.")
  })
  .passthrough()

export function registerReportChecklistTool(server: McpServer) {
  registerAppTool(
    server,
    "anet_report_checklist",
    {
      title: "ANET report guidance checklist",
      description:
        "Render a writing-standards checklist for the current report. " +
        "Use this when the user asks to review their report against the writing guidance.",
      inputSchema,
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI
        }
      }
    },
    async (args?: Record<string, unknown>) => {
      const ctx = normalizeBusinessCtx(args?.businessObject)
      const rawCriteria = Array.isArray(
        (args?.businessObject as Record<string, unknown>)?.guidanceCriteria
      )
        ? ((args?.businessObject as Record<string, unknown>)
            .guidanceCriteria as DictionaryCriterion[])
        : []
      const criteriaMap = buildDynamicCriteria(rawCriteria)
      const checklist = buildChecklist(ctx, criteriaMap)

      const payload = {
        toolName: "anet_report_checklist",
        checklist,
        businessObject: args?.businessObject ?? null
      }

      return {
        structuredContent: payload,
        content: [
          {
            type: "text",
            text: "Report guidance checklist rendered."
          }
        ]
      }
    }
  )
}
