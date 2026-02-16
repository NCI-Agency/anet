# ANET MCP UI

This MCP App hosts interactive UI views for ANET tools and can emit UI events (for example, apply actions) back to ANET.

## Install

From this folder:

```bash
npm install @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk cors express
npm install zod
npm install -D typescript tsx vite vite-plugin-singlefile concurrently cross-env @types/node @types/express @types/cors
```

## Build & run

```bash
npm run build
npm run serve
```

The MCP endpoint will be available at:

```
http://127.0.0.1:8001/mcp
```

## Tools

This MCP UI is designed to support multiple tools. Each tool should:
- Register with `_meta.ui.resourceUri` set to `ui://anet-mcp-ui/app`
- Include `toolName` in its arguments so the UI can route to the right view

The UI selects which view to render based on `toolName` in the tool arguments.

## Tool input contract

The tool expects:

```json
{
  "toolName": "optional string (defaults to anet_suggestion)",
  "fieldId": "string",
  "fieldLabel": "optional string",
  "currentText": "optional string",
  "suggestion": "string",
  "requestId": "optional string"
}
```

## Apply message format (anet_suggestion tool)

This Apply button is specific to the `anet_suggestion` tool. Other tools may render different UI actions.
When the user clicks **Apply**, the UI posts a message to `window.parent`/`window.top`:

```json
{
  "type": "anet.applySuggestion",
  "fieldId": "<fieldId>",
  "value": "<suggestion>",
  "fieldLabel": "<fieldLabel>",
  "requestId": "<requestId>",
  "source": "mcp-app"
}
```

ANET should listen for this event and update the target field (no DB write required).
