import PropTypes from "prop-types"
import React from "react"
import DEFAULT_AVATAR from "resources/default_avatar.svg"

export const AVATAR_DATA_PREAMBLE = "data:image/png;base64,"

const AvatarDisplayComponent = ({
  avatar,
  height,
  width,
  style,
  className
}) => (
  <img
    src={avatar ? `${AVATAR_DATA_PREAMBLE}${avatar}` : DEFAULT_AVATAR}
    className={className}
    height={height}
    width={width}
    alt="Avatar"
    style={style}
  />
)

AvatarDisplayComponent.propTypes = {
  avatar: PropTypes.string,
  className: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
  style: PropTypes.object
}

export default AvatarDisplayComponent
