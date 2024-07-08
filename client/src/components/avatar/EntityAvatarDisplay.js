import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"

export const EntityAvatarDisplay = ({ avatar, width, height }) => {
  const canvasRef = useRef()
  useEffect(() => {
    if (avatar?.applyCrop) {
      const canvas = canvasRef.current
      const context = canvas.getContext("2d", { desynchronized: true })
      context.clearRect(0, 0, canvas.width, canvas.height)
      const image = new Image()
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
      image.src = `/api/attachment/view/${avatar.attachmentUuid}`
    }
  }, [avatar, width, height])

  if (!avatar) {
    return null
  }

  return (
    <EntityAvatarStyledDiv>
      {avatar.applyCrop ? (
        <canvas ref={canvasRef} width={width} height={height} />
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
  display: inline-block;
  vertical-align: middle;
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
