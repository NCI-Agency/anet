import TriggerableConfirm from "components/TriggerableConfirm"
import React, { useCallback, useEffect } from "react"
import { useBlocker } from "react-router"

const handleRouteChange = (event: BeforeUnloadEvent) => {
  event.preventDefault()
  event.returnValue = ""
}

interface PromptProps {
  when?: boolean
  title?: string
  message?: string
  children?: React.ReactNode
}

const Prompt = ({ when, title, message, children }: PromptProps) => {
  const shouldBlock = useCallback(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
    [when]
  )
  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    if (!when) {
      return
    }
    window.addEventListener("beforeunload", handleRouteChange)

    return () => window.removeEventListener("beforeunload", handleRouteChange)
  }, [when])

  return (
    blocker.state === "blocked" && (
      <TriggerableConfirm
        showDialog
        renderTriggerButton={false}
        onConfirm={() => blocker.proceed()}
        onCancel={() => blocker.reset()}
        title={title}
        body={message}
      >
        {children}
      </TriggerableConfirm>
    )
  )
}

export default Prompt
