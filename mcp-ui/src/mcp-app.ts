import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables
} from "@modelcontextprotocol/ext-apps"

import {
  createApplySuggestionUI,
  renderApplySuggestionFromArgs
} from "./ui/applySuggestion"
import { createChecklistUI } from "./ui/checklist"
import {
  createFieldPickerUI,
  renderFieldPickerFromArgs,
  SuggestionField
} from "./ui/fieldPicker"
import { createReportSearchInputUI } from "./ui/reportSearchInput"
import { createReportSearchResultsUI } from "./ui/reportSearchResults"
import { getUserToken } from "./userToken"

const app = new App({
  name: "ANET MCP UI",
  version: "0.1.0"
})

const rootEl = document.getElementById("app-root")
if (!rootEl) {
  throw new Error("Missing #app-root element")
}

const setStatus = (message: string) => {
  const statusEl = rootEl.querySelector(".status")
  if (statusEl) statusEl.textContent = message
}

const applySuggestionUI = createApplySuggestionUI(rootEl)
const fieldPickerUI = createFieldPickerUI(rootEl, async (field: SuggestionField) => {
  // Optional: expose selected field to the host for better tool routing.
  try {
    await app.updateModelContext({
      structuredContent: {
        anet: {
          selectedFieldId: field.id,
          selectedFieldLabel: field.label,
          currentText: field.currentText ?? null
        }
      }
    })
  } catch {
    // Host may not support update-model-context ignore.
  }

  setStatus(`Generating suggestion for ${field.label}…`)
  try {
    const result = await app.callServerTool({
      name: "anet_agent_suggestion",
      arguments: {
        toolName: "anet_agent_suggestion",
        fieldId: field.id,
        fieldLabel: field.label,
        currentText: field.currentText ?? undefined
      }
    })

    if (result.isError) {
      setStatus("Suggestion tool failed.")
      return
    }

    let structured = (result.structuredContent ?? {}) as Record<string, unknown>

    if (!structured.fieldId || !structured.suggestion) {
      const textBlocks = (result.content ?? []).filter(block => block.type === "text")
      for (const block of textBlocks) {
        const text = "text" in block ? String(block.text ?? "") : ""
        const trimmed = text.trim()
        if (!trimmed) continue
        const jsonPayload = trimmed.startsWith("ANET_SUGGESTION_JSON:")
          ? trimmed.slice("ANET_SUGGESTION_JSON:".length)
          : trimmed
        try {
          const parsed = JSON.parse(jsonPayload)
          if (parsed && typeof parsed === "object") {
            structured = parsed as Record<string, unknown>
            break
          }
        } catch {
          continue
        }
      }
    }

    renderApplySuggestionFromArgs(applySuggestionUI, structured, setStatus)
  } catch {
    throw new Error("Failed to call agent tool")
  }
})

const checklistUI = createChecklistUI(rootEl, async req => {
  try {
    const result = await app.callServerTool({
      name: "anet_report_criterion_help",
      arguments: {
        fieldId: req.fieldId,
        criterionId: req.criterionId,
        criterionLabel: req.criterionLabel,
        currentText: req.currentText,
        businessObject: req.businessObject
      }
    })

    if (result.isError) return null

    const structured = (result.structuredContent ?? {}) as Record<string, unknown>
    if (typeof structured.text === "string" && structured.text.length > 0) {
      return structured.text
    }
    const textBlock = (result.content ?? []).find(block => block.type === "text")
    if (textBlock && "text" in textBlock && typeof textBlock.text === "string") {
      return textBlock.text
    }
    return null
  } catch {
    return null
  }
})

let reportSearchInputUI: ReturnType<typeof createReportSearchInputUI>

const reportSearchResultsUI = createReportSearchResultsUI(
  rootEl,
  previousQuery => {
    reportSearchInputUI.render({ defaultQuery: previousQuery })
  },
  async (query, nextLimit) => {
    const userToken = await getUserToken()
    const result = await app.callServerTool({
      name: "anet_report_search_results",
      arguments: { query, limit: nextLimit, userToken }
    })
    if (result.isError) {
      return
    }
    const structured = (result.structuredContent ?? {}) as Record<string, unknown>
    reportSearchResultsUI.render(structured)
  }
)

reportSearchInputUI = createReportSearchInputUI(
  rootEl,
  async (query, businessObject) => {
    void businessObject
    const userToken = await getUserToken()
    const result = await app.callServerTool({
      name: "anet_report_search_results",
      arguments: { query, userToken }
    })

    if (result.isError) {
      const errBlock = (result.content ?? []).find(b => b.type === "text")
      const errText =
        errBlock && "text" in errBlock && typeof errBlock.text === "string"
          ? errBlock.text
          : "Search failed."
      throw new Error(errText)
    }

    const structured = (result.structuredContent ?? {}) as Record<string, unknown>
    reportSearchResultsUI.render(structured)
  }
)

const toolHandlers = new Map<string, (args: unknown) => void>()
toolHandlers.set("anet_suggestion", args =>
  renderApplySuggestionFromArgs(applySuggestionUI, args, setStatus)
)
toolHandlers.set("anet_field_picker", args =>
  renderFieldPickerFromArgs(fieldPickerUI, args, setStatus)
)
toolHandlers.set("anet_report_checklist", args => checklistUI.render(args))
toolHandlers.set("anet_report_search_input", args =>
  reportSearchInputUI.render(args)
)
toolHandlers.set("anet_report_search_results", args =>
  reportSearchResultsUI.render(args)
)

function resolveToolName(args?: Record<string, unknown>): string {
  const toolNameFromArgs = typeof args?.toolName === "string" ? args.toolName : null
  if (toolNameFromArgs && toolHandlers.has(toolNameFromArgs)) return toolNameFromArgs

  const toolNameFromHost =
    typeof app.getHostContext()?.toolInfo?.tool?.name === "string"
      ? app.getHostContext()?.toolInfo?.tool?.name
      : null
  if (toolNameFromHost && toolHandlers.has(toolNameFromHost)) return toolNameFromHost

  if (args?.checklist && typeof args.checklist === "object") {
    return "anet_report_checklist"
  }
  // Some hosts send checklist tool-input with only businessObject on first render.
  // Keep this guarded fallback to avoid blank UI when toolInfo isn't available yet.
  if (
    args?.businessObject &&
    typeof args.businessObject === "object" &&
    !Array.isArray(args?.fields) &&
    typeof args?.fieldId !== "string" &&
    typeof args?.suggestion !== "string"
  ) {
    return "anet_report_checklist"
  }
  if (Array.isArray(args?.fields)) return "anet_field_picker"
  if (typeof args?.fieldId === "string" || typeof args?.suggestion === "string") {
    return "anet_suggestion"
  }
  return "anet_field_picker"
}

app.ontoolinput = (params) => {
  const args = params.arguments as Record<string, unknown> | undefined
  const toolName = resolveToolName(args)
  const handler = toolHandlers.get(toolName)
  if (!handler) {
    setStatus(`Unsupported tool: ${toolName}`)
    return
  }
  handler(args)
}

app.onhostcontextchanged = (ctx) => {
  if (ctx.theme) applyDocumentTheme(ctx.theme)
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables)
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts)
}

app.onteardown = async () => ({})

void app.connect()
