import PropTypes from "prop-types"
import React from "react"

const AttachmentImage = ({
  uuid,
  caption,
  iconSize,
  iconImage,
  contentMissing
}) => {
  const image = (
    <img
      className="image-preview info-show card-image attachment-image"
      src={iconImage}
      alt={caption}
      width={iconSize}
      height={iconSize}
      style={{ objectFit: "contain" }}
    />
  )
  return (
    <div className="img-container">
      {contentMissing ? (
        <>{image}</>
      ) : (
        <a href={`/api/attachment/view/${uuid}`} className="d-flex h-100">
          {image}
        </a>
      )}
    </div>
  )
}

AttachmentImage.propTypes = {
  uuid: PropTypes.string.isRequired,
  caption: PropTypes.string,
  iconSize: PropTypes.string.isRequired,
  iconImage: PropTypes.string.isRequired,
  contentMissing: PropTypes.bool.isRequired
}

export default AttachmentImage
