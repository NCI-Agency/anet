import "dotenv/config"
import cors from "cors"
import express from "express"

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"

import { createServer } from "./server.js"

const app = createMcpExpressApp({ host: "0.0.0.0" })

app.use(cors({ origin: "*", exposedHeaders: ["Mcp-Session-Id"] }))
app.use(express.json({ limit: "10mb" }))

app.all("/mcp", async (req, res) => {
  const server = createServer()
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  })

  res.on("close", async () => {
    await transport.close()
    await server.close()
  })

  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

const port = Number(process.env.PORT ?? 8001)

app.listen(port, () => {
  console.log(`ANET MCP App server listening on http://127.0.0.1:${port}/mcp`)
})
