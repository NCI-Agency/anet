import classNames from "classnames"
import PropTypes from "prop-types"
import React from "react"

const AttachmentImage = ({
  uuid,
  backgroundSize,
  backgroundImage,
  contentMissing
}) => {
  const image = (
    <div
      className="image-preview info-show card-image attachment-image"
      style={{
        backgroundSize,
        backgroundImage: `url(${backgroundImage})`
      }}
    />
  )
  return (
    <div
      className={classNames("img-container", {
        "img-hover-zoom": !contentMissing
      })}
    >
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
  backgroundSize: PropTypes.string.isRequired,
  backgroundImage: PropTypes.string.isRequired,
  contentMissing: PropTypes.bool.isRequired
}

export default AttachmentImage
