import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Modal } from "react-bootstrap"
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
        <Modal.Footer className="align-items-stretch">
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
