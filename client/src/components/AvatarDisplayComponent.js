import PropTypes from "prop-types"
import React from "react"
import DEFAULT_AVATAR from "resources/default_avatar.svg"

const AvatarDisplayComponent = ({
  avatarUuid,
  height,
  width,
  style,
  className
}) => (
  <img
    src={avatarUuid ? `/api/attachment/view/${avatarUuid}` : DEFAULT_AVATAR}
    className={className}
    height={height}
    width={width}
    alt="Avatar"
    style={style}
  />
)

AvatarDisplayComponent.propTypes = {
  avatarUuid: PropTypes.string,
  className: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
  style: PropTypes.object
}

export default AvatarDisplayComponent
