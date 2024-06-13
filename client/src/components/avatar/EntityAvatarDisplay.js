import PropTypes from "prop-types"
import React from "react"

export const EntityAvatarDisplay = ({ avatar, width, height }) => {
  const avatarStyle = {
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: "100%",
    display: "block",
    margin: "0 auto",
    marginBottom: "10px"
  }
  return (
    <>
      <img
        src={`/api/attachment/view-cropped/${avatar.attachmentUuid}/${avatar.cropLeft}/${avatar.cropTop}/${avatar.cropWidth}/${avatar.cropHeight}`}
        height={height}
        width={width}
        alt="Avatar"
        style={avatarStyle}
      />
    </>
  )
}

EntityAvatarDisplay.propTypes = {
  avatar: PropTypes.object,
  height: PropTypes.number,
  width: PropTypes.number
}

EntityAvatarDisplay.defaultProps = {
  height: 256,
  width: 256
}

export default EntityAvatarDisplay
