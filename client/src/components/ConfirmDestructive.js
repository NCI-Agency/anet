import TriggerableConfirm from "components/TriggerableConfirm"
import PropTypes from "prop-types"
import React from "react"

const ConfirmDestructive = ({
  removeable,
  onConfirm,
  operation,
  objectType,
  objectDisplay,
  objectOwner,
  variant,
  buttonLabel,
  buttonSize,
  buttonClassName,
  buttonDisabled,
  buttonId,
  children
}) => {
  const confirmText = "Yes, I am sure"
  const cancelText = "No, I am not entirely sure at this point"
  const title = `Confirm to ${operation} ${objectType}`
  const body = `Are you sure you want to ${operation} ${objectType} ${objectDisplay}? This cannot be undone.`

  return (
    <TriggerableConfirm
      onConfirm={onConfirm}
      title={title}
      body={body}
      removeable={removeable}
      objectOwner={objectOwner}
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
ConfirmDestructive.propTypes = {
  removeable: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  operation: PropTypes.string.isRequired,
  objectType: PropTypes.string.isRequired,
  objectDisplay: PropTypes.string.isRequired,
  objectOwner: PropTypes.string,
  variant: PropTypes.string,
  buttonLabel: PropTypes.string,
  buttonSize: PropTypes.string,
  buttonClassName: PropTypes.string,
  buttonDisabled: PropTypes.bool,
  buttonId: PropTypes.string,
  children: PropTypes.node
}
ConfirmDestructive.defaultProps = {
  operation: "delete"
}

export default ConfirmDestructive
