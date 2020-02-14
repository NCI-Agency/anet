import AvatarComponent from "components/AvatarComponent"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

const AvatarEditModal = ({ title, onAvatarUpdate, size }) => {
  const [showModal, setShowModal] = useState(false)
  const [currentPreview, setCurrentPreview] = useState(null)

  return (
    <div>
      <button onClick={open}>{title}</button>

      <Modal bsSize={size} show={showModal} onHide={close}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AvatarComponent onChangePreview={updateAvatarPreview} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={save}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )

  function close() {
    setShowModal(false)
  }

  function save() {
    const updatedAvatar = currentPreview.substring(
      "data:image/jpeg;base64,".length - 1
    )
    onAvatarUpdate(updatedAvatar)
    close()
  }

  function open(e) {
    e.preventDefault()
    setShowModal(true)
  }

  function updateAvatarPreview(preview) {
    setCurrentPreview(preview)
  }
}
AvatarEditModal.propTypes = {
  title: PropTypes.string.isRequired,
  onAvatarUpdate: PropTypes.func.isRequired,
  size: PropTypes.string
}

export default AvatarEditModal
