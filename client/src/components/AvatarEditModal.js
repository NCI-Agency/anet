import AvatarComponent from "components/AvatarComponent"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal } from "react-bootstrap"

const AvatarEditModal = ({ title, currentAvatar, images, onAvatarUpdate }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button variant="outline-secondary" onClick={open}>
        {title}
      </Button>

      <Modal
        centered
        backdrop="static"
        show={showModal}
        onHide={close}
        size="xl"
        style={{ zIndex: "1202" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AvatarComponent
            currentAvatar={currentAvatar}
            images={images}
            onClose={close}
            onSave={save}
          />
        </Modal.Body>
      </Modal>
    </>
  )

  function open(e) {
    e.preventDefault()
    setShowModal(true)
  }

  function close() {
    setShowModal(false)
  }

  async function dataUrlToBytes(dataUrl) {
    const res = await fetch(dataUrl)
    return new Uint8Array(await res.arrayBuffer())
  }

  async function save(chosenImage, imageData) {
    onAvatarUpdate(chosenImage, await dataUrlToBytes(imageData))
    close()
  }
}

AvatarEditModal.propTypes = {
  title: PropTypes.string.isRequired,
  currentAvatar: PropTypes.object,
  images: PropTypes.array.isRequired,
  onAvatarUpdate: PropTypes.func.isRequired
}

export default AvatarEditModal
