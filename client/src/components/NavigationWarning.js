import Prompt from "components/Prompt"
import PropTypes from "prop-types"
import React from "react"

const LEAVE_TITLE = "Warning: unsaved changes"
const LEAVE_WARNING =
  "Are you sure you wish to navigate away from the page? You will lose unsaved changes."

const NavigationWarning = ({ isBlocking }) => {
  return (
    <Prompt when={isBlocking} title={LEAVE_TITLE} message={LEAVE_WARNING} />
  )
}

NavigationWarning.propTypes = {
  isBlocking: PropTypes.bool
}

export default NavigationWarning
