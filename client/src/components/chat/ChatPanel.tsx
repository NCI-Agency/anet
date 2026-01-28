import { useChatBridge } from "components/chat/ChatBridge"
import React from "react"
import Settings from "settings"

const base = {
  position: "relative",
  flex: "0 0 auto",
  overflow: "hidden",
  transition: "width 0.3s ease",
  width: 0,
  maxWidth: 500,
  borderLeft: "1px solid #ddd",
  backgroundColor: "#f9f9f9",
  zIndex: 10,
  height: "100%"
}
const openStyle = { ...base, width: "25%" }

export default function ChatPanel() {
  const { isOpen, onIframeLoad, setIframeEl } = useChatBridge()

  return (
    <div style={isOpen ? openStyle : base}>
      <iframe
        ref={setIframeEl}
        onLoad={onIframeLoad}
        src={Settings.chatAssistantUrl}
        title="ChatGPT Panel"
        style={{ width: "100%", height: "100%", border: "none" }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        loading="lazy"
      />
    </div>
  )
}
