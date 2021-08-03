import "components/react-confirm-bootstrap.css"
import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"
import Confirm from "react-confirm-bootstrap"

const ConfirmDestructive = ({
  onConfirm,
  operation,
  objectType,
  objectDisplay,
  variant,
  buttonLabel,
  children,
  ...otherProps
}) => {
  const confirmText = `Yes, I am sure that I want to ${operation} ${objectType} ${objectDisplay}`
  const title = `Confirm to ${operation} ${objectType}`
  const body = `Are you sure you want to ${operation} this ${objectType}? This cannot be undone.`

  return (
    <Confirm
      onConfirm={onConfirm}
      title={title}
      body={body}
      confirmText={confirmText}
      cancelText="No, I am not entirely sure at this point"
      dialogClassName="react-confirm-bootstrap-modal"
      confirmBSStyle="primary"
    >
      <Button variant={variant} {...otherProps}>
        {buttonLabel}
        {children}
      </Button>
    </Confirm>
  )
}
ConfirmDestructive.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  objectType: PropTypes.string.isRequired,
  operation: PropTypes.string.isRequired,
  objectDisplay: PropTypes.string.isRequired,
  variant: PropTypes.string,
  buttonLabel: PropTypes.string,
  children: PropTypes.node
}
ConfirmDestructive.defaultProps = {
  operation: "delete"
}

export default ConfirmDestructive
