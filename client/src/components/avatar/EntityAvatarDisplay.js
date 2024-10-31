import styled from "@emotion/styled"
import { Organization, Person } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"
import { CircleStencil, RectangleStencil } from "react-advanced-cropper"
import DEFAULT_ORGANIZATION_AVATAR from "resources/default-organization-avatar.svg"
import DEFAULT_PERSON_AVATAR from "resources/default-person-avatar.svg"

export const AVATAR_SETTINGS = {
  [Organization.relatedObjectType]: {
    default: DEFAULT_ORGANIZATION_AVATAR,
    stencil: RectangleStencil,
    rounded: false
  },
  [Person.relatedObjectType]: {
    default: DEFAULT_PERSON_AVATAR,
    stencil: CircleStencil,
    rounded: true
  }
}

export const EntityAvatarDisplay = ({
  avatar,
  defaultAvatar,
  width,
  height,
  style
}) => {
  const canvasRef = useRef()
  const avatarSettings = AVATAR_SETTINGS[defaultAvatar]
  const attachmentUrl = avatar?.attachmentUuid
    ? `/api/attachment/view/${avatar.attachmentUuid}`
    : avatarSettings?.default
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
      image.src = attachmentUrl
    }
  }, [avatar, width, height, attachmentUrl])

  if (!attachmentUrl) {
    return null
  }

  return (
    <EntityAvatarStyledDiv
      imgHeight={height}
      rounded={avatarSettings?.rounded}
      style={style}
    >
      {avatar?.applyCrop ? (
        <canvas ref={canvasRef} width={width} height={height} />
      ) : (
        <img
          src={attachmentUrl}
          height={height}
          width={width}
          style={{ objectFit: "contain" }}
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
  height: ${p => p.imgHeight}px;
  border-radius: ${p => p.rounded && "50%"};
  overflow: hidden;
`

EntityAvatarDisplay.propTypes = {
  avatar: PropTypes.object,
  defaultAvatar: PropTypes.string.isRequired,
  height: PropTypes.number,
  width: PropTypes.number,
  style: PropTypes.object
}

EntityAvatarDisplay.defaultProps = {
  height: 256,
  width: 256
}

export default EntityAvatarDisplay
