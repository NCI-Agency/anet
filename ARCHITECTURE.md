# Architecture of the Chat Assistant
This page documents ANET's AI chat and MCP flow as implemented by `AssistantService.dll`.

![diagram.png](/.attachments/diagram-8dae8a9d-b068-4c66-9a72-a76f3291b46f.png)

---

## Blocks
| Block | Role |
| --- | --- |
| ANET App | Owns page state and form fields; sends page context; applies UI actions. |
| Chat Bridge / Chat Iframe | Embedded chat interface inside ANET; relays context and user prompts. |
| AI Client / Host | `AssistantService.dll` that calls the AI model and MCP servers; renders MCP UI. |
| AI Model | Chooses between a direct reply or a tool call. |
| MCP Server(s) | Implements tools; returns results and optional UI `resourceUri`. |
| MCP UI | HTML/JS UI rendered in the iframe; posts UI actions back to ANET. |

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
businessObject
suggestions
```

**UI action payloads (MCP UI -> ANET)**
```
type: "anet.applySuggestion"
fieldId
value
fieldLabel
requestId
source: "mcp-app"
```

---

## Flow
1. ANET App -> Chat Bridge: `postMessage` with `{ businessObject, suggestions }`
2. Chat Bridge -> AI Client: user prompt (typed text or suggestion click)
3. AI Client -> AI Model: prompt + context
4. AI Model -> AI Client: response or tool decision
5. AI Client -> MCP Server (optional): `tools/call`
6. MCP Server -> AI Client (optional): result + `resourceUri`
7. AI Client -> MCP UI (optional): load UI + tool-input
8. MCP UI -> ANET App (optional): `postMessage` UI action
9. ANET App (optional): updates target field(s)

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
6. MCP UI sends `postMessage` with a UI action; ANET updates the field.

**Data lookup (Apollo MCP)**
1. User asks: "Show the latest report for Kabul Hospital."
2. The AI Model chooses an Apollo tool; host runs `tools/call` with query arguments.
3. MCP server returns results (and optional `resourceUri`).
4. Host returns a text summary or renders the MCP UI if provided.

---

## Notes
- The AI model decides what to do; the host decides how to execute it.
- MCP Servers never `postMessage` to ANET.
- MCP UI is the only component that sends UI action messages.
