# Architecture of the Chat Assistant

This page documents ANET's AI chat and MCP flow as implemented by `AssistantService.dll`.
> For installation, configuration, and operational details, see [`docs/deploy-ai.md`](https://github.com/NCI-Agency/anet/blob/main/docs/deploy-ai.md)

![diagram.png](/.attachments/diagram-8dae8a9d-b068-4c66-9a72-a76f3291b46f.png)

---

## Blocks
| Block | Role |
| --- | --- |
| ANET App | Owns page state and form fields; sends page context; applies UI actions; serves the user's Keycloak token to the iframe on request. |
| Chat Bridge / Chat Iframe | Embedded chat interface inside ANET; relays context and user prompts; routes UI actions back to ANET. |
| AI Client / Host | `AssistantService.dll` that calls the AI model and MCP servers; renders MCP UI. |
| AI Model | Chooses between a direct reply or a tool call. |
| **Apollo MCP** (`anet-mcp`) | GraphQL data-tools server. Auths to ANET `/graphqlWebService` with a single service-account token (`ANET_GRAPHQL_TOKEN`). All calls run as one shared identity. |
| **mcp-ui** (`anet-mcp-ui`) | UI-tools server + iframe renderer. The report-search tool reads each user's Keycloak token (via the `request_user_token` handshake) and calls `/graphql` as that user. |
| MCP UI | HTML/JS UI rendered in the iframe; posts UI actions back to ANET. |
  
**mcp-ui tools:** `anet_suggestion`, `anet_agent_suggestion`, `anet_field_picker`, `anet_report_checklist`, `anet_report_criterion_help`, `anet_report_search_input`, `anet_report_search_results`.

**Apollo MCP operations:** loaded from `src/test/resources/operations/` (`searchReports`, `recentReports`, `adminSettings`, …).

---

## Core Protocols
| Link | Protocol |
| --- | --- |
| ANET <-> Chat iframe | `postMessage` |
| Host <-> MCP Server | `tools/list`, `tools/call`, `resources/read` |
| Host <-> MCP UI | `ui/initialize`, `ui/notifications/tool-input`, `ui/message` |

- **`postMessage`**: Browser-to-iframe messaging. Used to send page context and suggestions into the chat, and to send UI actions back to ANET.
- **`tools/list`**: Asks an MCP server which tools are available.
- **`tools/call`**: Runs a specific tool on the MCP server with arguments.
- **`resources/read`**: Fetches the HTML/JS UI resource for a tool when the tool returns a `resourceUri`.
- **`ui/initialize`**: Host/iframe handshake so the MCP UI knows the host capabilities and can start.
- **`ui/notifications/tool-input`**: Delivers the tool arguments into the UI so it can render.
- **`ui/message`**: Allows the UI to send a user-style message back to the host for a follow-up model request.

---

## Data Contracts

**Page context (ANET -> Chat iframe)**

```
application: "ANET"
businessObject: { …page-specific fields, currentPage }
suggestions: ChatSuggestion[]
ChatSuggestion: { label, prompt, icon?, iconColor? }
```

**UI action envelope (MCP UI -> ANET, via window.top postMessage)**

```
{ action: <string>, payload: <object> }
```

**Action types currently used:**

| Action | Payload | Effect |
| --- | --- | --- |
| `apply_suggestion` | `{ fieldId, value, fieldLabel, requestId }` | ANET sets the field value |
| `open_suggestion_diff` | `{ fieldId, fieldLabel, currentText, suggestion, requestId }` | ANET opens the DiffModal |
| `select_suggestion_field` | `{ fieldId, fieldLabel }` | ANET tracks the user's chosen field |
| `open_report` | `{ uuid }` | ANET navigates to `/reports/<uuid>` |
| `request_user_token` | `{}` | ANET replies via `event.source.postMessage` with `{ type: "anet.userToken", token }`. mcp-ui caches the token and injects it into per-user tool args. Token never enters chat history or LLM context. |

---

## Flow

1. **ANET App -> Chat Bridge**: `postMessage` with `{ application, businessObject, suggestions }`.
2. **Chat Bridge -> AI Client**: user prompt (typed text or suggestion click).
3. **AI Client -> AI Model**: prompt + context.
4. **AI Model -> AI Client**: response or tool decision.
5. **AI Client -> MCP Server** (optional): `tools/call`.
6. **MCP Server -> AI Client** (optional): result + `resourceUri`.
7. **AI Client -> MCP UI** (optional): load UI + tool-input.
8. **MCP UI -> ANET App** (optional): `postMessage` UI action (any of the action types above).
9. **ANET App** (optional): updates target field(s), opens modal, or navigates.

**Per-user auth handshake (parallel to the main flow):**

1. On first need, MCP UI sends `postMessage { action: "request_user_token" }` to `window.top`.
2. Chat Bridge replies with `postMessage { type: "anet.userToken", token: keycloak.token }` via `event.source`.
3. mcp-ui caches the token and injects it into `anet_report_search_results` tool arguments so GraphQL runs as the actual user.
---

## Example Flows

**Plain response (no MCP)**

1. User asks a general question.
2. The AI Model returns a direct response.
3. Host renders the text response in the chat.

**Improve field (ApplySuggestion MCP)**

1. User asks: "Suggest improvements for the Next Steps."
2. The AI Model chooses a suggestion tool; host executes `tools/call` with `fieldId`, `fieldLabel`, `currentText`.
3. MCP server returns result + `resourceUri`.
4. Host loads the MCP UI and injects the tool input.
5. UI renders the suggestion; user clicks Apply.
6. MCP UI sends `{ action: "apply_suggestion", payload: { fieldId, value, fieldLabel, requestId } }` to `window.top`.
7. ANET updates the field.

**Data lookup ([Apollo MCP](https://dev.azure.com/ncia-anet/ANET/_wiki/wikis/ANET.wiki/97/MCP))**

1. User asks: "Show the latest report for Kabul Hospital."
2. The AI Model chooses an Apollo tool; host runs `tools/call` with query arguments.
3. MCP server returns results (and optional `resourceUri`).
4. Host returns a text summary or renders the MCP UI if provided.

**Per-user report search (mcp-ui with Keycloak token)**

1. User clicks the "Find reports" suggestion; AI Model invokes `anet_report_search_input`.
2. MCP UI renders the search form. On first render it asks ANET for the user's token (`request_user_token`).
3. User submits a query; mcp-ui calls `anet_report_search_results` with the token in args.
4. The tool calls ANET `/graphql` as that user; results are scoped to the user's permissions.
5. User clicks **Open** on a result → `{ action: "open_report", payload: { uuid } }` → ANET navigates to `/reports/<uuid>`.

---

## Notes

- The AI model decides *what* to do; the host decides *how* to execute it.
- **Apollo MCP** runs all calls as one service-account identity (shared, not per-user).
- **mcp-ui** runs the per-user path; its `anet_report_search_results` tool scopes GraphQL calls to the caller's Keycloak token.
- MCP Servers never `postMessage` to ANET. MCP UI is the only component that sends UI action messages.
- The user token is delivered iframe ↔ ANET via `postMessage`. It is never injected into chat history or the LLM's context window.
- ANET pages keep the chat context fresh via `useChatPageContext` — a stack-based registration so nested pages override and pop correctly on unmount.
