import "components/react-confirm-bootstrap.css"
import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"
import Confirm from "react-confirm-bootstrap"

const TriggerableConfirm = ({
  onConfirm,
  title,
  body,
  confirmText,
  cancelText,
  bsStyle,
  buttonLabel,
  buttonRef,
  ...otherProps
}) => (
  <Confirm
    onConfirm={onConfirm}
    title={title}
    body={body}
    confirmText={confirmText}
    cancelText={cancelText}
    dialogClassName="react-confirm-bootstrap-modal"
    confirmBSStyle="primary"
  >
    <Button bsStyle={bsStyle} {...otherProps} ref={buttonRef}>
      {buttonLabel}
    </Button>
  </Confirm>
)
TriggerableConfirm.propTypes = {
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  body: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  bsStyle: PropTypes.string,
  buttonLabel: PropTypes.string,
  buttonRef: PropTypes.object
}

export default TriggerableConfirm
