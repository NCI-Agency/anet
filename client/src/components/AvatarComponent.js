import { preventZoom } from "advanced-cropper/extensions/prevent-zoom"
import AttachmentCard from "components/Attachment/AttachmentCard"
import PropTypes from "prop-types"
import React, { useRef, useState } from "react"
import { CircleStencil, Cropper } from "react-advanced-cropper"
import "react-advanced-cropper/dist/style.css"
import "react-advanced-cropper/dist/themes/compact.css"
import { Button } from "react-bootstrap"
import "./AvatarComponent.css"

const AvatarComponent = ({ currentAvatar, images, onClose, onSave }) => {
  const [chosenImage, setChosenImage] = useState(currentAvatar)
  const cropperRef = useRef(null)

  return (
    <>
      {chosenImage && (
        <Cropper
          ref={cropperRef}
          className="custom-cropper"
          src={`/api/attachment/view/${chosenImage.uuid}`}
          stencilComponent={CircleStencil}
          backgroundWrapperProps={{
            scaleImage: false
          }}
          postProcess={preventZoom}
        />
      )}
      <div className="d-flex justify-content-between">
        <Button onClick={onClose} variant="outline-secondary">
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
  )

  function roundEdges(canvas) {
    const context = canvas.getContext("2d")
    if (context) {
      const { width, height } = canvas
      context.fillStyle = "#fff"
      context.globalCompositeOperation = "destination-in"
      context.beginPath()
      context.scale(1, height / width)
      context.arc(width / 2, width / 2, width / 2, 0, Math.PI * 2)
      context.closePath()
      context.fill()
    }
    return canvas
  }

  function onClick() {
    const cropper = cropperRef.current
    if (cropper) {
      const canvas = cropper.getCanvas()
      const imageData = roundEdges(canvas).toDataURL()
      onSave(chosenImage, imageData)
    }
  }
}

AvatarComponent.propTypes = {
  currentAvatar: PropTypes.object,
  images: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
}

export default AvatarComponent
