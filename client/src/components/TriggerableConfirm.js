import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Modal } from "react-bootstrap"
import "./TriggerableConfirm.css"

const TriggerableConfirm = ({
  onConfirm,
  onCancel,
  title,
  body,
  confirmText,
  cancelText,
  variant,
  showDialog,
  renderTriggerButton,
  buttonLabel,
  buttonSize,
  buttonClassName,
  buttonDisabled,
  buttonId,
  buttonRef,
  children
}) => {
  const [show, setShow] = useState(showDialog)
  const handleClose = () => {
    setShow(false)
    if (typeof onCancel === "function") {
      onCancel()
    }
  }
  const handleShow = () => setShow(true)

  return (
    <>
      {renderTriggerButton && (
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
      )}

      <Modal
        centered
        size="lg"
        backdrop="static"
        keyboard={false}
        show={show}
        onHide={handleClose}
        className="triggerable-confirm-bootstrap-modal"
        style={{ zIndex: "1300" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{body}</Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Col>
            <Button
              className="float-start"
              variant="outline-secondary"
              onClick={handleClose}
            >
              {cancelText}
            </Button>
          </Col>
          <Col>
            <Button
              className="float-end"
              variant="danger"
              onClick={() => {
                onConfirm()
                handleClose()
              }}
            >
              {confirmText}
            </Button>
          </Col>
        </Modal.Footer>
      </Modal>
    </>
  )
}
TriggerableConfirm.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  title: PropTypes.string,
  body: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.string,
  showDialog: PropTypes.bool,
  renderTriggerButton: PropTypes.bool,
  buttonLabel: PropTypes.string,
  buttonSize: PropTypes.string,
  buttonClassName: PropTypes.string,
  buttonDisabled: PropTypes.bool,
  buttonId: PropTypes.string,
  buttonRef: PropTypes.object,
  children: PropTypes.node
}
TriggerableConfirm.defaultProps = {
  confirmText: "OK",
  cancelText: "Cancel",
  showDialog: false,
  renderTriggerButton: true
}

export default TriggerableConfirm
