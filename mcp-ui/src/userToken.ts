/**
 * Fetch the current ANET user's Keycloak token from the host page.
 *
 * Round-trip: post `{ action: "request_user_token" }` to `window.top`; ChatBridge
 * replies via `event.source.postMessage({ type: "anet.userToken", token })`.
 * The token is cached for the lifetime of the iframe.
 *
 * We pull the token here (not from chat businessObject) so it never enters the
 * LLM's view or chat history.
 */

const REQUEST_TIMEOUT_MS = 5000

let cachedToken: string | null = null
let pending: Promise<string | null> | null = null

export function getUserToken(): Promise<string | null> {
  if (cachedToken) return Promise.resolve(cachedToken)
  if (pending) return pending

  pending = new Promise(resolve => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data
      if (
        data &&
        typeof data === "object" &&
        data.type === "anet.userToken" &&
        typeof data.token === "string"
      ) {
        cleanup()
        cachedToken = data.token
        resolve(cachedToken)
      }
    }

    const timeoutId = window.setTimeout(() => {
      cleanup()
      console.warn("[mcp-ui] userToken request timed out")
      resolve(null)
    }, REQUEST_TIMEOUT_MS)

    function cleanup() {
      window.removeEventListener("message", onMessage)
      window.clearTimeout(timeoutId)
      pending = null
    }

    window.addEventListener("message", onMessage)

    try {
      if (!window.top || window.top === window) {
        cleanup()
        resolve(null)
        return
      }
      window.top.postMessage({ action: "request_user_token" }, "*")
    } catch (err) {
      cleanup()
      console.error("[mcp-ui] failed to post request_user_token", err)
      resolve(null)
    }
  })

  return pending
}
