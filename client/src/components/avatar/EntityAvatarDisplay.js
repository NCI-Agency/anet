import styled from "@emotion/styled"
import { Organization, Person } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"
import DEFAULT_ORGANIZATION_AVATAR from "resources/default-organization-avatar.svg"
import DEFAULT_PERSON_AVATAR from "resources/default-person-avatar.svg"

const DEFAULT_AVATARS = {
  [Organization.relatedObjectType]: DEFAULT_ORGANIZATION_AVATAR,
  [Person.relatedObjectType]: DEFAULT_PERSON_AVATAR
}

export const EntityAvatarDisplay = ({
  avatar,
  defaultAvatar,
  width,
  height,
  style
}) => {
  const canvasRef = useRef()
  const attachmentUrl = avatar?.attachmentUuid
    ? `/api/attachment/view/${avatar.attachmentUuid}`
    : DEFAULT_AVATARS[defaultAvatar]
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
    <EntityAvatarStyledDiv style={style}>
      {avatar?.applyCrop ? (
        <canvas ref={canvasRef} width={width} height={height} />
      ) : (
        <img src={attachmentUrl} height={height} width={width} alt="Avatar" />
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
