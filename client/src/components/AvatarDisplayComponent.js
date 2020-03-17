import React from "react"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import PropTypes from "prop-types"

export const AVATAR_IMAGE_DATA_PREFIX = "data:image/png;base64,"

const AvatarDisplayComponent = ({ avatar, height, width, style }) => (
  <img
    src={avatar ? `${AVATAR_IMAGE_DATA_PREFIX}${avatar}` : DEFAULT_AVATAR}
    height={height}
    width={width}
    alt="Avatar"
    style={style}
  />
)

AvatarDisplayComponent.propTypes = {
  avatar: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
  style: PropTypes.object
}

export default AvatarDisplayComponent
