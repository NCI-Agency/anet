import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

interface SimpleModalProps {
  title: string
  size?: string
  children?: React.ReactNode
}

const SimpleModal = (props: SimpleModalProps) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <span className="asLink" onClick={() => setShowModal(true)}>
        {props.title}
      </span>

      <Modal
        backdrop="static"
        centered
        size={props.size}
        show={showModal}
        onHide={() => setShowModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>{props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.children}</Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => setShowModal(false)}
            variant="outline-secondary"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default SimpleModal
