import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { preventZoom } from "advanced-cropper/extensions/prevent-zoom"
import AttachmentCard from "components/Attachment/AttachmentCard"
import React, { useEffect, useRef, useState } from "react"
import { Cropper, ImageRestriction } from "react-advanced-cropper"
import "react-advanced-cropper/dist/style.css"
import "react-advanced-cropper/dist/themes/compact.css"
import { Button, Modal } from "react-bootstrap"
import Settings from "settings"
import "./EntityAvatarComponent.css"

interface EntityAvatarEditModalProps {
  title: string
  avatar?: any
  stencil?: any
  images: any[]
  onAvatarUpdate: (...args: unknown[]) => unknown
}

const EntityAvatarEditModal = ({
  title,
  avatar,
  stencil,
  images,
  onAvatarUpdate
}: EntityAvatarEditModalProps) => {
  const croppeableMimeTypes = Settings.fields.attachment.fileTypes
    .filter(fileType => fileType.avatar && fileType.crop)
    .map(fileType => fileType.mimeType)

  const [showModal, setShowModal] = useState(false)
  const [chosenImageUuid, setChosenImageUuid] = useState(null)
  const [cropperCoordinates, setCropperCoordinates] = useState(null)
  const cropperRef = useRef(null)

  // Update chosen image uuid and coordinates from avatar if present
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

  const maximize = () => {
    if (cropperRef.current) {
      cropperRef.current.setCoordinates(({ imageSize }) => {
        const size = Math.max(imageSize.width, imageSize.height)
        return {
          width: size,
          height: size,
          left: (imageSize.width - size) / 2,
          top: (imageSize.height - size) / 2
        }
      })
    }
  }

  const reset = () => {
    if (cropperRef.current) {
      cropperRef.current.setCoordinates(
        cropperRef.current.getDefaultState()?.coordinates
      )
    }
  }

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
                stencilProps={{
                  aspectRatio: 1
                }}
                imageRestriction={ImageRestriction.none}
                defaultCoordinates={cropperCoordinates}
                ref={cropperRef}
                className="custom-cropper"
                src={`/api/attachment/view/${chosenImageUuid}`}
                stencilComponent={stencil}
                backgroundWrapperProps={{
                  moveImage: false,
                  scaleImage: false
                }}
                postProcess={preventZoom}
              />
            )}
            <div className="d-flex justify-content-between">
              <Button onClick={close} variant="outline-secondary">
                Cancel
              </Button>
              <div>
                <Button
                  onClick={maximize}
                  variant="secondary"
                  disabled={!chosenImageUuid}
                >
                  <Icon icon={IconNames.MAXIMIZE} />
                </Button>
                <Button
                  onClick={reset}
                  variant="secondary"
                  disabled={!chosenImageUuid}
                  className="ms-1"
                >
                  <Icon icon={IconNames.RESET} />
                </Button>
              </div>
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
    if (croppeableMimeTypes.includes(image.mimeType)) {
      setCropperCoordinates(null)
    } else {
      // If the user chooses an image that can not be cropped just save
      save(image.uuid, null)
    }
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

  function save(imageUuid, coordinates) {
    onAvatarUpdate(imageUuid, coordinates)
    close()
  }
}

export default EntityAvatarEditModal
