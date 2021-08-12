import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"
import "./TriggerableConfirm.css"

const TriggerableConfirm = ({
  onConfirm,
  title,
  body,
  confirmText,
  cancelText,
  variant,
  buttonLabel,
  buttonSize,
  buttonClassName,
  buttonDisabled,
  buttonId,
  buttonRef,
  children
}) => {
  const [show, setShow] = useState(false)
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <>
      <Button
        variant={variant}
        onClick={handleShow}
        size={buttonSize}
        className={buttonClassName}
        disabled={buttonDisabled}
        id={buttonId}
        ref={buttonRef}
      >
        {buttonLabel}
        {children}
      </Button>

      <Modal
        show={show}
        onHide={handleClose}
        className="triggerable-confirm-bootstrap-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{body}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
TriggerableConfirm.propTypes = {
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  body: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.string,
  buttonLabel: PropTypes.string,
  buttonSize: PropTypes.string,
  buttonClassName: PropTypes.string,
  buttonDisabled: PropTypes.bool,
  buttonId: PropTypes.string,
  buttonRef: PropTypes.object,
  children: PropTypes.node
}

export default TriggerableConfirm
