import PropTypes from "prop-types"
import React from "react"
import DEFAULT_AVATAR from "resources/default_avatar.svg"

const AvatarDisplayComponent = ({ avatar, height, width, style }) => (
  <img
    className="avatar-display"
    src={avatar || DEFAULT_AVATAR}
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
