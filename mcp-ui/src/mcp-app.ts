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
import {
  createFieldPickerUI,
  renderFieldPickerFromArgs,
  SuggestionField
} from "./ui/fieldPicker"

const app = new App({
  name: "ANET MCP UI",
  version: "0.1.0"
})

if (!rootEl) {
  throw new Error("Missing #app-root element");
}

const applySuggestionUI = createApplySuggestionUI(rootEl);

const setStatus = (message: string) => {
  const statusEl = rootEl.querySelector(".status");
  if (statusEl) statusEl.textContent = message;
};

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

  // Ask the host to generate a suggestion and invoke anet_suggestion.
  const currentTextBlock = field.currentText
    ? `\n\nCurrent text:\n"""\n${field.currentText}\n"""`
    : ""

  const prompt =
    `Generate improved text for the ANET field "${field.label}" (fieldId: ${field.id}).` +
    currentTextBlock +
    `\n\nThen call the MCP tool \"anet_suggestion\" with arguments:` +
    `\n{` +
    `\n  \"fieldId\": \"${field.id}\",` +
    `\n  \"fieldLabel\": \"${field.label}\",` +
    (field.currentText
      ? `\n  \"currentText\": ${JSON.stringify(field.currentText)},`
      : "") +
    `\n  \"suggestion\": \"<your suggestion>\"` +
    `\n}`

  setStatus(`Requesting suggestion for ${field.label}…`)
  try {
    await app.sendMessage({
      role: "user",
      content: [{ type: "text", text: prompt }]
    })
  } catch {
    throw new Error("Failed to send message to host")
  }
})

const toolHandlers = new Map<string, (args: unknown) => void>()
toolHandlers.set("anet_suggestion", args =>
  renderApplySuggestionFromArgs(applySuggestionUI, args, setStatus)
)
toolHandlers.set("anet_field_picker", args =>
  renderFieldPickerFromArgs(fieldPickerUI, args, setStatus)
)

function resolveToolName(args?: Record<string, unknown>): string {
  if (typeof args?.toolName === "string") return args.toolName
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
