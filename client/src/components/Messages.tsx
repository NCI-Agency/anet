import React from "react"
import { Alert } from "react-bootstrap"

interface MessagesProps {
  error?: any
  warning?: string
  success?: string
}

const Messages = ({ error, warning, success }: MessagesProps) => (
  <div>
    {error && (
      <Alert variant="danger">
        {error.statusText && `${error.statusText}: `}
        {error.message}
      </Alert>
    )}
    {warning && <Alert variant="warning">{warning}</Alert>}
    {success && <Alert variant="success">{success}</Alert>}
  </div>
)

export default Messages
