import Prompt from "components/Prompt"
import React from "react"

const LEAVE_TITLE = "Warning: unsaved changes"
const LEAVE_WARNING =
  "Are you sure you wish to navigate away from the page? You will lose unsaved changes."

interface NavigationWarningProps {
  isBlocking?: boolean
}

const NavigationWarning = ({ isBlocking }: NavigationWarningProps) => (
  <Prompt when={isBlocking} title={LEAVE_TITLE} message={LEAVE_WARNING} />
)

export default NavigationWarning
