import AvatarComponent from "components/AvatarComponent"
import { AVATAR_DATA_PREAMBLE } from "components/AvatarDisplayComponent"
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
        size="lg"
        style={{ zIndex: "1202" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AvatarComponent onChangePreview={setCurrentPreview} />
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button onClick={close} variant="outline-secondary">
            Cancel
          </Button>
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
    // Strip preamble, only leaving the base64-encoded data
    const re = new RegExp(`^${AVATAR_DATA_PREAMBLE}`)
    const b64 = currentPreview?.replace(re, "") || null
    onAvatarUpdate(b64)
    close()
  }
}
AvatarEditModal.propTypes = {
  title: PropTypes.string.isRequired,
  onAvatarUpdate: PropTypes.func.isRequired
}

export default AvatarEditModal
