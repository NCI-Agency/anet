/**
 * MCP UI → ANET host messaging.
 *
 * Posts `{ action, payload }` envelopes directly to `window.top` so the ANET
 * ChatBridge can route them via its single `event.data.action` handler.
 *
 * We don't use `app.sendMessage` for this because AssistantService doesn't
 * intercept action envelopes — it forwards the message to the LLM, which then
 * responds to the JSON as if it were a chat turn.
 */

export function sendAction(
  action: string,
  payload: Record<string, unknown> = {}
): void {
  try {
    if (!window.top || window.top === window) return
    window.top.postMessage({ action, payload }, "*")
  } catch (err) {
    console.error(`[mcp-ui] sendAction(${action}) failed`, err)
  }
}
