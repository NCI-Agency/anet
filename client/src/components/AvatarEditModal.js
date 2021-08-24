import AvatarComponent from "components/AvatarComponent"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

const AvatarEditModal = ({ title, onAvatarUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [currentPreview, setCurrentPreview] = useState(null)

  return (
    <div style={{ marginTop: "10px" }}>
      <Button variant="outline-secondary" onClick={open}>
        {title}
      </Button>

      <Modal
        centered
        show={showModal}
        onHide={close}
        size="xl"
        style={{ zIndex: "10000" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AvatarComponent onChangePreview={setCurrentPreview} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={save} variant="primary">
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )

  function open(e) {
    e.preventDefault()
    setShowModal(true)
  }

  function close() {
    setShowModal(false)
  }

  function save() {
    onAvatarUpdate(currentPreview)
    close()
  }
}
AvatarEditModal.propTypes = {
  title: PropTypes.string.isRequired,
  onAvatarUpdate: PropTypes.func.isRequired
}

export default AvatarEditModal
