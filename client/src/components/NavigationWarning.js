import PropTypes from "prop-types"
import React, { useEffect } from "react"
import { Prompt } from "react-router-dom"

const LEAVE_WARNING =
  "Are you sure you wish to navigate away from the page? You will lose unsaved changes."

const NavigationWarning = props => {
  const { isBlocking } = props
  useEffect(() => {
    window.addEventListener("beforeunload", onBeforeUnloadListener)

    return () =>
      window.removeEventListener("beforeunload", onBeforeUnloadListener)

    function onBeforeUnloadListener(event) {
      if (isBlocking) {
        event.returnValue = LEAVE_WARNING
        event.preventDefault()
      }
    }
  }, [isBlocking])

  return <Prompt when={isBlocking} message={LEAVE_WARNING} />
}

NavigationWarning.propTypes = {
  isBlocking: PropTypes.bool
}

export default NavigationWarning
