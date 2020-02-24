import React from "react"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import PropTypes from "prop-types"

const AvatarDisplayComponent = ({ avatar, height, width, style }) => {
  const image =
    avatar === null || avatar === ""
      ? DEFAULT_AVATAR
      : "data:image/jpeg;base64," + avatar

  return (
    <img src={image} height={height} width={width} alt="Avatar" style={style} />
  )
}
AvatarDisplayComponent.propTypes = {
  avatar: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
  style: PropTypes.object
}

export default AvatarDisplayComponent
