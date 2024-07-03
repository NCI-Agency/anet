import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React, { useEffect } from "react"

export const EntityAvatarDisplay = ({ avatar, width, height }) => {
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
    <EntityAvatarStyledDiv>
      {avatar.applyCrop ? (
        <canvas id="avatar" width={width} height={height} />
      ) : (
        <img
          src={`/api/attachment/view/${avatar.attachmentUuid}`}
          height={height}
          width={width}
          alt="Avatar"
        />
      )}
    </EntityAvatarStyledDiv>
  )
}
const EntityAvatarStyledDiv = styled.div`
  display: block;
  margin: 0 auto 10px;
  max-width: 100%;
`

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
