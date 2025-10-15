import ConfirmDestructive from "components/ConfirmDestructive"
import React from "react"
import { Alert, Button } from "react-bootstrap"
import utils from "utils"

interface MessagesProps {
  error?: any
  warning?: string
  success?: string
  className?: string
  children?: React.ReactNode
}

const Messages = ({
  error,
  warning,
  success,
  className,
  children
}: MessagesProps) => (
  <div>
    {error && (
      <Alert variant="danger" className={className}>
        <div>
          {error.statusText && `${error.statusText}: `}
          {error.message}
        </div>
        {children}
      </Alert>
    )}
    {warning && (
      <Alert variant="warning" className={className}>
        {warning}
      </Alert>
    )}
    {success && (
      <Alert variant="success" className={className}>
        {success}
      </Alert>
    )}
  </div>
)

interface MessagesWithConflictProps {
  error?: object
  objectType: string
  onCancel: () => void
  onConfirm: () => void
}

export const MessagesWithConflict = ({
  error,
  objectType,
  onCancel,
  onConfirm
}: MessagesWithConflictProps) => {
  return (
    <Messages error={error} className="w-100 d-flex justify-content-between">
      {utils.isConflictError(error) && (
        <div className="float-end align-items-center">
          <Button
            variant="outline-secondary"
            onClick={onCancel}
            className="m-1"
          >
            Discard my changes
          </Button>
          <ConfirmDestructive
            onConfirm={onConfirm}
            operation="save"
            objectType={`this ${objectType}`}
            objectDisplay=""
            variant="danger"
            buttonLabel="Overwrite with my own changes"
            buttonClassName="m-1"
          />
        </div>
      )}
    </Messages>
  )
}

export default Messages
