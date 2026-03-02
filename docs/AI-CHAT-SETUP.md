# AI Chat Setup (AssistantService.dll + MCPs)
This guide covers the full setup to run the ANET AI chat feature, including the MCP servers, the AssistantService host, and VPN requirements.

## Prerequisites
- VPN connected to reach the DataScience endpoints referenced in `config.json`.
- Docker installed and running (for Apollo MCP).
- Node.js and npm installed (for the MCP UI app).
- .NET 9 runtime installed
- ANET backend running on the host (GraphQL must be reachable at `http://localhost:8080/graphqlWebService`).

## Components To Run
- **Assistant Service**: The .NET host that talks to the model and MCP servers.
- **Apollo MCP**: Data tools backed by ANET GraphQL.
- **ANET MCP UI**: UI tools that render in the chat iframe.

## Start Order
1. Connect VPN.
2. Start ANET.
3. Start Apollo MCP.
4. Start ANET MCP UI.
5. Start AssistantService.
6. Open ANET and use the chat panel.

## Start Apollo MCP
From the ANET repo root:
```bash
./apollo-mcp-server.sh
```
This uses `apollo-mcp-config.yaml` and mounts `src/test/resources` into the container as `/data`.

## Start ANET MCP UI
From the ANET repo root:
```bash
cd mcp-ui
npm install
npm run build
npm run serve
```
The MCP UI endpoint should be available at `http://127.0.0.1:8001/mcp`.

## Start AssistantService
From the AssistantService folder:
```bash
dotnet AssistantService.dll
```

## Quick Validation
- `http://localhost:8080/graphqlWebService` responds (ANET backend).
- `http://localhost:8000/mcp` responds (Apollo MCP).
- `http://localhost:8001/mcp` responds (ANET MCP UI).
- AssistantService logs show it loaded `config.json` and `mcp-config.json`.

## AssistantService Configuration Files
Here is just a quick run through all the main configuration files that you may need to look into

### `config.json`
Model and prompt configuration.
- `Models.<modelId>.Uri`: LLM endpoint base URL.
- `Models.<modelId>.Versions.<version>.Applications.<app>.MCP`: MCPs enabled for that application.
- `PromptPreamble`: system instructions for the assistant.

### `mcp-config.json`
MCP server registry.
- `mcpServers.<name>.url`: MCP endpoint URL.
- Typical names used here: `anet-mcp` (Apollo) and `anet-mcp-ui` (UI tools).

### `appsettings.json`
Base .NET service settings.
- `Kestrel.Endpoints`: service listen URLs and TLS cert.
- `ConnectionStrings.DatascienceProxy`: DataScience gateway (VPN required).
- `ConnectionStrings.LocalProxy`: local model gateway (if used).
- `AIProxyKey`, `DataScienceModels`, embeddings and vector DB settings.

### `appsettings.Development.json`, `appsettings.Production.json`, `appsettings.Development.Production.json`
Environment overrides for the same settings as `appsettings.json`.

### `AssistantTypes.json`
Default prompt templates by assistant type (e.g., Chat, Review, Summarize).

### `objectConfig.json`
App-specific overrides for prompt templates and field settings.
