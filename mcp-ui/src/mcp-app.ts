import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables
} from "@modelcontextprotocol/ext-apps";

import {
  createApplySuggestionUI,
  renderApplySuggestionFromArgs
} from "./ui/applySuggestion";

const app = new App({
  name: "ANET MCP UI",
  version: "0.1.0"
});

const rootEl = document.getElementById("app-root");
if (!rootEl) {
  throw new Error("Missing #app-root element");
}

const applySuggestionUI = createApplySuggestionUI(rootEl);

const setStatus = (message: string) => {
  const statusEl = rootEl.querySelector(".status");
  if (statusEl) statusEl.textContent = message;
};

const toolHandlers = new Map<string, (args: unknown) => void>();
toolHandlers.set("anet_suggestion", args =>
  renderApplySuggestionFromArgs(applySuggestionUI, args, setStatus)
);

app.ontoolinput = (params) => {
  const args = params.arguments as Record<string, unknown> | undefined;
  const toolName =
    typeof args?.toolName === "string"
      ? args.toolName
      : "anet_suggestion";
  const handler = toolHandlers.get(toolName);
  if (!handler) {
    setStatus(`Unsupported tool: ${toolName}`);
    return;
  }
  handler(params.arguments);
};

app.onhostcontextchanged = (ctx) => {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);
};

app.onteardown = async () => ({});

void app.connect();
