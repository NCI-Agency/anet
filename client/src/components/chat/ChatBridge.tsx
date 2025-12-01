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
  send: (businessObject: any, suggestions: ChatSuggestion[]) => void
  setIframeEl: (el: HTMLIFrameElement | null) => void
  isReady: boolean
  origin?: string
}

const ChatBridgeContext = createContext<ChatBridgeContextType | null>(null)
export const useChatBridge = () => {
  const ctx = useContext(ChatBridgeContext)
  if (!ctx) {
    throw new Error("useChatBridge must be used within ChatBridgeProvider")
  }
  return ctx
}

export const ChatBridgeProvider: FC<{ children }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [iframeEl, setIframeElState] = useState<HTMLIFrameElement | null>(null)
  const [targetOrigin, setTargetOrigin] = useState(undefined)
  const [isReady, setIsReady] = useState(false)
  const [iframeOrigin, setIframeOrigin] = useState(undefined)
  const queue = useRef<any[]>([])

  useEffect(() => {
    const handleMessage = ev => {
      if (targetOrigin && ev.origin !== targetOrigin) {
        return
      }
      if (!iframeOrigin) {
        setIframeOrigin(ev.origin)
      }

      if (typeof ev.data === "string" && ev.data === "ready") {
        setIsReady(true)
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [iframeOrigin, targetOrigin])

  useEffect(() => {
    if (!iframeEl) {
      return
    }

    let computedOrigin
    try {
      computedOrigin = new URL(iframeEl.src, window.location.href).origin
    } catch {
      computedOrigin = undefined
    }
    setTargetOrigin(computedOrigin)

    let attempts = 0
    const maxAttempts = 20
    const intervalMs = 500

    let timer = null

    const ping = () => {
      attempts += 1
      iframeEl.contentWindow?.postMessage(
        { type: "PING" },
        computedOrigin || "*"
      )
      if (isReady || attempts >= maxAttempts) {
        if (timer) {
          clearInterval(timer)
          timer = null
        }
      }
    }

    timer = setInterval(ping, intervalMs)
    ping()

    return () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }, [iframeEl, isReady])

  // Flush queued messages once ready
  useEffect(() => {
    if (!isReady || !iframeEl) {
      return
    }
    while (queue.current.length) {
      const msg = queue.current.shift()!
      iframeEl.contentWindow?.postMessage(msg, targetOrigin || "*")
    }
  }, [isReady, iframeEl, targetOrigin])

  const setIframeEl = useCallback(el => {
    setIframeElState(el)
    setIsReady(false)
  }, [])

  const send = useCallback(
    (context, suggestions) => {
      const payload = {
        application: "ANET",
        businessObject: context || {},
        suggestions: suggestions || []
      }
      if (!iframeEl || !isReady) {
        queue.current.push(payload)
        return
      }
      iframeEl.contentWindow?.postMessage(payload, targetOrigin || "*")
    },
    [iframeEl, isReady, targetOrigin]
  )

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(s => !s), [])

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      send,
      setIframeEl,
      isReady,
      origin: iframeOrigin
    }),
    [isOpen, open, close, toggle, send, setIframeEl, isReady, iframeOrigin]
  )

  return (
    <ChatBridgeContext.Provider value={value}>
      {children}
    </ChatBridgeContext.Provider>
  )
}
