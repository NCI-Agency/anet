import { preventZoom } from "advanced-cropper/extensions/prevent-zoom"
import AttachmentCard from "components/Attachment/AttachmentCard"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { Cropper, RectangleStencil } from "react-advanced-cropper"
import { Button, Modal } from "react-bootstrap"

const EntityAvatarEditModal = ({ title, avatar, images, onAvatarUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [chosenImageUuid, setChosenImageUuid] = useState(null)
  const [cropperCoordinates, setCropperCoordinates] = useState(null)
  const cropperRef = useRef(null)

  // Update chosen image Uuid  and coordinates from avatar if present
  useEffect(() => {
    if (avatar) {
      setChosenImageUuid(avatar.attachmentUuid)
      setCropperCoordinates({
        left: avatar.cropLeft,
        top: avatar.cropTop,
        width: avatar.cropWidth,
        height: avatar.cropHeight
      })
    } else {
      setChosenImageUuid(null)
      setCropperCoordinates(null)
    }
  }, [avatar])

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
          <>
            {chosenImageUuid && (
              <Cropper
                defaultCoordinates={cropperCoordinates}
                ref={cropperRef}
                className="custom-cropper"
                src={`/api/attachment/view/${chosenImageUuid}`}
                stencilComponent={RectangleStencil}
                backgroundWrapperProps={{
                  scaleImage: false
                }}
                postProcess={preventZoom}
              />
            )}
            <div className="d-flex justify-content-between">
              <Button onClick={close} variant="outline-secondary">
                Cancel
              </Button>
              <Button onClick={onClick} variant="primary">
                Save
              </Button>
            </div>
            <div className="mt-3 mb-3" style={{ fontSize: "1.25rem" }}>
              Pick an image:
            </div>
            <div className="attachment-card-list">
              {images?.map(image => (
                <AttachmentCard
                  key={image.uuid}
                  attachment={image}
                  onClick={setChosenImage}
                />
              ))}
            </div>
          </>
        </Modal.Body>
      </Modal>
    </>
  )

  function setChosenImage(image) {
    setChosenImageUuid(image.uuid)
    setCropperCoordinates(null)
  }

  function onClick() {
    const cropper = cropperRef.current
    if (cropper) {
      save(chosenImageUuid, cropper.getCoordinates())
    }
  }

  function open(e) {
    e.preventDefault()
    setShowModal(true)
  }

  function close() {
    setShowModal(false)
  }

  async function save(imageUuid, coordinates) {
    onAvatarUpdate(imageUuid, coordinates)
    close()
  }
}

EntityAvatarEditModal.propTypes = {
  title: PropTypes.string.isRequired,
  avatar: PropTypes.object,
  images: PropTypes.array.isRequired,
  onAvatarUpdate: PropTypes.func.isRequired
}

export default EntityAvatarEditModal
