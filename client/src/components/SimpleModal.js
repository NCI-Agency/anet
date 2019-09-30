import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

const SimpleModal = props => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <span className="asLink" onClick={() => setShowModal(true)}>
        {props.title}
      </span>

      <Modal
        bsSize={props.size}
        show={showModal}
        onHide={() => setShowModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>{props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.children}</Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

SimpleModal.propTypes = {
  title: PropTypes.string.isRequired,
  size: PropTypes.string,
  children: PropTypes.node
}

export default SimpleModal
