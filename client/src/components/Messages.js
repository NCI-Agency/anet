import PropTypes from "prop-types"
import React from "react"
import { Alert } from "react-bootstrap"

const Messages = ({ error, warning, success }) => (
  <div>
    {error && (
      <Alert bsStyle="danger">
        {error.statusText && `${error.statusText}: `}
        {error.message}
      </Alert>
    )}
    {warning && <Alert bsStyle="warning">{warning}</Alert>}
    {success && <Alert bsStyle="success">{success}</Alert>}
  </div>
)
Messages.propTypes = {
  error: PropTypes.object,
  warning: PropTypes.string,
  success: PropTypes.string
}

export default Messages
