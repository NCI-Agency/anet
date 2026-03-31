import React from "react"

interface AttachmentImageProps {
  uuid: string
  caption?: string
  iconImage: string
  contentMissing: boolean
}

const AttachmentImage = ({
  uuid,
  caption,
  iconImage,
  contentMissing
}: AttachmentImageProps) => {
  const image = (
    <img
      className="image-preview info-show card-image attachment-image"
      src={iconImage}
      alt={caption}
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

export default AttachmentImage
