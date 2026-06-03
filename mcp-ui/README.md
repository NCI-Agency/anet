# ANET MCP UI

This MCP App hosts interactive UI views for ANET tools and can emit UI events (for example, apply actions) back to ANET.

## Install

From this folder:

```bash
npm install @modelcontextprotocol/ext-apps @modelcontextprotocol/sdk @openai/agents openai cors express
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

Currently registered tools include:
- `anet_field_picker` (choose a target field)
- `anet_suggestion` (show suggestion + Apply)
- `anet_agent_suggestion` (generate suggestion server-side)

### Agent tool configuration

`anet_agent_suggestion` requires these environment variables:
- `ANET_AGENT_BASE_URL` (or `OPENAI_BASE_URL`)
- `ANET_AGENT_API_KEY` (or `OPENAI_API_KEY`)
- `ANET_AGENT_MODEL` (or `OPENAI_MODEL`)

### Report search configuration

`anet_report_search_results` calls ANET's GraphQL API directly:
- `ANET_GRAPHQL_TOKEN` (required) — bearer token for `/graphqlWebService`. Reuse the same value as `apollo-mcp-config.yaml`'s `Authorization` header.
- `ANET_GRAPHQL_URL` (optional, default `http://localhost:8080/graphqlWebService`) — endpoint to query.

The tool also uses an LLM agent (via `@openai/agents`) to extract a search keyword from natural-language queries before hitting GraphQL, so it shares the same env vars as `anet_agent_suggestion` (`ANET_AGENT_BASE_URL`, `ANET_AGENT_API_KEY`, `ANET_AGENT_MODEL`). If those aren't set, the tool falls back to using the raw user query as the GraphQL `text` filter.

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
