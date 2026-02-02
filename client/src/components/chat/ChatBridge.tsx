import React, {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { useLocation } from "react-router-dom"
import Settings from "settings"

export type ChatSuggestion = {
  label: string
  prompt: string
  icon?: string
  iconColor?: string
}

type ChatBridgeContextType = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  isReady: boolean
  setIframeEl: (el: HTMLIFrameElement | null) => void
  onIframeLoad: () => void
  send: (context?: any, suggestions?: ChatSuggestion[]) => void
  registerPageContext: (ctx?: any, suggestions?: ChatSuggestion[]) => symbol
  unregisterPageContext: (token: symbol) => void
}

const ChatBridgeContext = createContext<ChatBridgeContextType | null>(null)
export const useChatBridge = () => {
  const ctx = useContext(ChatBridgeContext)
  if (!ctx) {
    if (Settings.chatAssistant.enabled) {
      throw new Error("useChatBridge must be used within ChatBridgeProvider")
    }
    return {}
  }
  return ctx
}

const DEFAULT_CONTEXT: any = {}
const DEFAULT_SUGGESTIONS: ChatSuggestion[] = [
  {
    label: "Summarize",
    prompt: "Summarize what I'm viewing",
    icon: "list-bullets"
  },
  {
    label: "Explain",
    prompt: "Explain what this ANET page is used for",
    icon: "book"
  },
  {
    label: "Search",
    prompt: "Help me find reports, people, or tasks",
    icon: "magnifying-glass"
  }
]

const buildPayload = (ctx?: any, suggestions?: ChatSuggestion[]) => {
  const payload = {
    application: "ANET",
    businessObject: { ...(ctx ?? DEFAULT_CONTEXT) },
    suggestions: suggestions ?? DEFAULT_SUGGESTIONS
  }

  payload.businessObject.currentPage = `${window.location.pathname}${window.location.search}${window.location.hash}`

  return payload
}

export const ChatBridgeProvider: FC<{ children }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const location = useLocation()

  const iframeElRef = useRef<HTMLIFrameElement | null>(null)
  const chatAssistantOrigin = useRef(new URL(Settings.chatAssistant.url).origin)

  const queueRef = useRef<any[]>([])

  type StackItem = { token: symbol; ctx?: any; suggestions?: ChatSuggestion[] }
  const stackRef = useRef<StackItem[]>([])

  const lastSentRef = useRef<string | null>(null)

  const getActive = useCallback(() => {
    const top = stackRef.current[stackRef.current.length - 1]
    return top
      ? { ctx: top.ctx, suggestions: top.suggestions }
      : { ctx: DEFAULT_CONTEXT, suggestions: DEFAULT_SUGGESTIONS }
  }, [])

  const _post = useCallback(
    (payload: any) => {
      const win = iframeElRef.current?.contentWindow
      const key = JSON.stringify(payload)
      if (key === lastSentRef.current) {
        return
      }
      lastSentRef.current = key

      if (!win || !isReady) {
        queueRef.current.push(payload)
        return
      }
      win.postMessage(payload, chatAssistantOrigin.current)
    },
    [isReady]
  )

  const flushQueue = useCallback(() => {
    const win = iframeElRef.current?.contentWindow
    if (!win || !isReady) {
      return
    }
    while (queueRef.current.length) {
      win.postMessage(queueRef.current.shift(), chatAssistantOrigin.current)
    }
  }, [isReady])

  const announceActive = useCallback(() => {
    const { ctx, suggestions } = getActive()
    _post(buildPayload(ctx, suggestions))
  }, [_post, getActive])

  const setIframeEl = useCallback((el: HTMLIFrameElement | null) => {
    iframeElRef.current = el
    setIsReady(false)
  }, [])

  const onIframeLoad = useCallback(() => {
    setIsReady(true)
  }, [])

  const send = useCallback(
    (context?: any, suggestions?: ChatSuggestion[]) => {
      _post(buildPayload(context, suggestions))
    },
    [_post]
  )

  const registerPageContext = useCallback(
    (ctx?: any, suggestions?: ChatSuggestion[]) => {
      const token = Symbol("chat-page")
      stackRef.current.push({ token, ctx, suggestions })
      announceActive()
      return token
    },
    [announceActive]
  )

  const unregisterPageContext = useCallback(
    (token: symbol) => {
      const idx = stackRef.current.findIndex(s => s.token === token)
      if (idx >= 0) {
        stackRef.current.splice(idx, 1)
      }
      announceActive()
    },
    [announceActive]
  )

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== chatAssistantOrigin.current) {
        return
      }
      const type = typeof ev.data === "string" ? ev.data : ev.data?.type
      if (type === "ready") {
        if (!isReady) {
          setIsReady(true)
        }
        announceActive()
        flushQueue()
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [announceActive, flushQueue, isReady])

  useEffect(() => {
    if (!isReady) {
      return
    }
    let attempts = 0
    const max = 5
    const id = window.setInterval(() => {
      attempts += 1
      lastSentRef.current = null
      announceActive()
      flushQueue()
      if (attempts >= max) {
        window.clearInterval(id)
      }
    }, 300)
    lastSentRef.current = null
    announceActive()
    flushQueue()
    return () => window.clearInterval(id)
  }, [announceActive, flushQueue, isReady])

  useEffect(() => {
    const el = iframeElRef.current
    if (!el || !isReady) {
      return
    }
    let attempts = 0
    const max = 20
    const id = window.setInterval(() => {
      attempts += 1
      el.contentWindow?.postMessage(
        { type: "PING" },
        chatAssistantOrigin.current
      )
      if (isReady || attempts >= max) {
        window.clearInterval(id)
      }
    }, 500)
    el.contentWindow?.postMessage({ type: "PING" }, chatAssistantOrigin.current)
    return () => window.clearInterval(id)
  }, [setIframeEl, isReady])

  useEffect(() => {
    announceActive()
  }, [announceActive])

  useEffect(() => {
    announceActive()
  }, [announceActive, location.pathname, location.search, location.hash])

  const open = useCallback(() => {
    setIsOpen(true)
    announceActive()
  }, [announceActive])

  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => {
    setIsOpen(s => !s)
    announceActive()
  }, [announceActive])

  const value = useMemo<ChatBridgeContextType>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      isReady,
      setIframeEl,
      onIframeLoad,
      send,
      registerPageContext,
      unregisterPageContext
    }),
    [
      isOpen,
      open,
      close,
      toggle,
      isReady,
      setIframeEl,
      onIframeLoad,
      send,
      registerPageContext,
      unregisterPageContext
    ]
  )

  return (
    <ChatBridgeContext.Provider value={value}>
      {children}
    </ChatBridgeContext.Provider>
  )
}

export function useChatPageContext(ctx?: any, suggestions?: ChatSuggestion[]) {
  const { registerPageContext, unregisterPageContext } = useChatBridge()
  useEffect(() => {
    const token = registerPageContext(ctx, suggestions)
    return () => unregisterPageContext(token)
  }, [registerPageContext, unregisterPageContext, ctx, suggestions])
}
