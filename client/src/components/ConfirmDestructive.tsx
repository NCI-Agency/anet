import TriggerableConfirm from "components/TriggerableConfirm"
import React from "react"

interface ConfirmDestructiveProps {
  onConfirm: (...args: unknown[]) => unknown
  operation: string
  objectType: string
  objectDisplay: string
  variant?: string
  buttonLabel?: string
  buttonSize?: string
  buttonClassName?: string
  buttonDisabled?: boolean
  buttonId?: string
  children?: React.ReactNode
}

const ConfirmDestructive = ({
  onConfirm,
  operation,
  objectType,
  objectDisplay,
  variant,
  buttonLabel,
  buttonSize,
  buttonClassName,
  buttonDisabled,
  buttonId,
  children
}: ConfirmDestructiveProps) => {
  const confirmText = "Yes, I am sure"
  const cancelText = "No, I am not entirely sure at this point"
  const title = `Confirm to ${operation} ${objectType}`
  const body = `Are you sure you want to ${operation} ${objectType} ${objectDisplay}? This cannot be undone.`

  return (
    <TriggerableConfirm
      onConfirm={onConfirm}
      title={title}
      body={body}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      buttonLabel={buttonLabel}
      buttonSize={buttonSize}
      buttonClassName={buttonClassName}
      buttonDisabled={buttonDisabled}
      buttonId={buttonId}
    >
      {children}
    </TriggerableConfirm>
  )
}
ConfirmDestructive.defaultProps = {
  operation: "delete"
}

export default ConfirmDestructive
