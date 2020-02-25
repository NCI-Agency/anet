import React from "react"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import PropTypes from "prop-types"

const AvatarDisplayComponent = ({ avatar, height, width, style }) => (
  <img
    src={avatar ? `data:image/jpeg;base64,${avatar}` : DEFAULT_AVATAR}
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
