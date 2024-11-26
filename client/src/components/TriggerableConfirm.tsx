import React, { useState } from "react"
import { Button, Col, Modal, OverlayTrigger, Tooltip } from "react-bootstrap"
import "./TriggerableConfirm.css"

interface TriggerableConfirmProps {
  onConfirm: (...args: unknown[]) => unknown
  onCancel?: (...args: unknown[]) => unknown
  title?: string
  body?: string | any
  confirmText?: string
  cancelText?: string
  variant?: string
  showDialog?: boolean
  renderTriggerButton?: boolean
  buttonLabel?: string
  buttonSize?: string
  buttonTitle?: string
  buttonClassName?: string
  buttonDisabled?: boolean
  buttonId?: string
  buttonRef?: any
  children?: React.ReactNode
}

const TriggerableConfirm = ({
  onConfirm,
  onCancel,
  title,
  body,
  confirmText = "OK",
  cancelText = "Cancel",
  variant,
  showDialog = false,
  renderTriggerButton = true,
  buttonLabel,
  buttonSize,
  buttonTitle,
  buttonClassName,
  buttonDisabled,
  buttonId,
  buttonRef,
  children
}: TriggerableConfirmProps) => {
  const [show, setShow] = useState(showDialog)
  const handleClose = () => {
    setShow(false)
    if (typeof onCancel === "function") {
      onCancel()
    }
  }
  const handleShow = () => setShow(true)
  const ButtonElement = (
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
  )
  const ButtonWithOptionalTooltip = buttonTitle ? (
    <OverlayTrigger placement="top" overlay={<Tooltip>{buttonTitle}</Tooltip>}>
      {ButtonElement}
    </OverlayTrigger>
  ) : (
    ButtonElement
  )

  return (
    <>
      {renderTriggerButton && ButtonWithOptionalTooltip}

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

export default TriggerableConfirm
