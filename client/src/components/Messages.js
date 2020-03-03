import PropTypes from "prop-types"
import React from "react"
import { Alert } from "react-bootstrap"

const Messages = ({ error, success }) => (
  <div>
    {error && (
      <Alert bsStyle="danger">
        {error.statusText && `${error.statusText}: `}
        {error.message}
      </Alert>
    )}
    {success && <Alert bsStyle="success">{success}</Alert>}
  </div>
)
Messages.propTypes = {
  error: PropTypes.object,
  success: PropTypes.string
}

export default Messages
