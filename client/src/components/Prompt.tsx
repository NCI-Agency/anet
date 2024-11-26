import TriggerableConfirm from "components/TriggerableConfirm"
import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useState
} from "react"
import { UNSAFE_NavigationContext } from "react-router-dom"

interface PromptProps {
  when?: boolean
  title?: string
  message?: string
  children?: React.ReactNode
}

/**
 * Prompt was removed from react-router v6, see:
 * https://github.com/remix-run/react-router/issues/8139
 */
const Prompt = ({ when, title, message, children }: PromptProps) => {
  const { navigator } = useContext(UNSAFE_NavigationContext)
  const [displayDialog, setDisplayDialog] = useState(false)
  const [transition, setTransition] = useState()
  const leavePage = useCallback(() => {
    transition?.retry()
    setDisplayDialog(false)
  }, [transition])
  const stayOnPage = useCallback(() => {
    setDisplayDialog(false)
  }, [])

  useLayoutEffect(() => {
    if (!when) {
      return
    }

    const { block, location } = navigator
    const { pathname } = location
    const unblock = block(transition => {
      const {
        location: { pathname: targetPathname }
      } = transition

      // Don't show an alert if the user is navigating to the same page
      if (targetPathname === pathname) {
        return
      }
      setDisplayDialog(true)
      setTransition({
        ...transition,
        retry() {
          unblock()
          transition.retry()
        }
      })
    })

    return unblock
  }, [navigator, when])

  if (!displayDialog) {
    return
  }
  return (
    <TriggerableConfirm
      showDialog
      renderTriggerButton={false}
      onConfirm={leavePage}
      onCancel={stayOnPage}
      title={title}
      body={message}
    >
      {children}
    </TriggerableConfirm>
  )
}

export default Prompt
