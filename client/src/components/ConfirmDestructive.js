import TriggerableConfirm from "components/TriggerableConfirm"
import PropTypes from "prop-types"
import React from "react"

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
  setIsNotesCanvasVisible,
  children
}) => {
  const confirmText = `Yes, I am sure that I want to ${operation} ${objectType} ${objectDisplay}`
  const cancelText = "No, I am not entirely sure at this point"
  const title = `Confirm to ${operation} ${objectType}`
  const body = `Are you sure you want to ${operation} this ${objectType}? This cannot be undone.`

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
      setIsNotesCanvasVisible={setIsNotesCanvasVisible}
    >
      {children}
    </TriggerableConfirm>
  )
}
ConfirmDestructive.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  operation: PropTypes.string.isRequired,
  objectType: PropTypes.string.isRequired,
  objectDisplay: PropTypes.string.isRequired,
  variant: PropTypes.string,
  buttonLabel: PropTypes.string,
  buttonSize: PropTypes.string,
  buttonClassName: PropTypes.string,
  buttonDisabled: PropTypes.bool,
  buttonId: PropTypes.string,
  setIsNotesCanvasVisible: PropTypes.func,
  children: PropTypes.node
}
ConfirmDestructive.defaultProps = {
  operation: "delete"
}

export default ConfirmDestructive
