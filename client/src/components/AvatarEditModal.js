import AvatarComponent from "components/AvatarComponent"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

const AvatarEditModal = ({ title, onAvatarUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [currentPreview, setCurrentPreview] = useState(null)

  return (
    <div>
      <button onClick={open}>{title}</button>

      <Modal show={showModal} onHide={close}>
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AvatarComponent onChangePreview={setCurrentPreview} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={save}>Save</Button>
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
    const updatedAvatar = currentPreview.substring(
      "data:image/jpeg;base64,".length - 1
    )
    onAvatarUpdate(updatedAvatar)
    close()
  }
}
AvatarEditModal.propTypes = {
  title: PropTypes.string.isRequired,
  onAvatarUpdate: PropTypes.func.isRequired
}

export default AvatarEditModal
