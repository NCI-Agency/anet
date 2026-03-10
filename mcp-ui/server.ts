/// <reference types="node" />
import { readFile } from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

import {
  RESOURCE_MIME_TYPE,
  registerAppResource
} from "@modelcontextprotocol/ext-apps/server"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

import { registerAnetSuggestionTool } from "./tools/anetSuggestion.js"
import { registerAgentSuggestionTool } from "./tools/agentSuggestion.js"
import { registerFieldPickerTool } from "./tools/fieldPicker.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RESOURCE_URI = "ui://anet-mcp-ui/app"

async function loadResourceHtml() {
  const candidate = path.join(__dirname, "mcp-app.html")
  try {
    return await readFile(candidate, "utf-8")
  } catch (error) {
    throw new Error(`Unable to locate mcp-app.html at ${candidate}`)
  }
}

export function createServer() {
  const server = new McpServer({
    name: "anet-mcp-ui",
    version: "0.1.0"
  })

  registerAnetSuggestionTool(server)
  registerAgentSuggestionTool(server)
  registerFieldPickerTool(server)

  registerAppResource(
    server,
    "ANET MCP UI",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await loadResourceHtml()
      return {
        contents: [
          {
            uri: RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html
          }
        ]
      }
    }
  )

  return server
}
