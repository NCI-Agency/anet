import PropTypes from "prop-types"
import React, { useEffect } from "react"

export const EntityAvatarDisplay = ({ avatar, width, height }) => {
  const avatarStyle = {
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: "100%",
    display: "block",
    margin: "0 auto",
    marginBottom: "10px"
  }
  useEffect(() => {
    if (avatar.applyCrop) {
      const canvas = document.getElementById("avatar")
      const context = canvas.getContext("2d")
      const image = new Image()
      image.src = `/api/attachment/view/${avatar.attachmentUuid}`
      image.onload = function() {
        context.drawImage(
          image,
          avatar.cropLeft,
          avatar.cropTop,
          avatar.cropWidth,
          avatar.cropHeight,
          0,
          0,
          width,
          height
        )
      }
    }
  }, [avatar, width, height])

  return (
    <>
      {avatar.applyCrop ? (
        <>
          <canvas
            id="avatar"
            width={width}
            height={height}
            style={avatarStyle}
          />
        </>
      ) : (
        <>
          <img
            src={`/api/attachment/view/${avatar.attachmentUuid}`}
            height={height}
            width={width}
            alt="Avatar"
            style={avatarStyle}
          />
        </>
      )}
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
