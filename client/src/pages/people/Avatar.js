import AttachmentCard from "components/Attachment/AttachmentCard"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import PropTypes from "prop-types"
import React from "react"

export const PersonAvatar = ({ avatar, avatarUuid, width, height }) => {
  const avatarStyle = {
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: "100%",
    display: "block",
    margin: "0 auto",
    marginBottom: "10px"
  }
  return (
    <>
      {(avatar && (
        <AttachmentCard
          attachment={avatar}
          previewStyle={avatarStyle}
          captionStyle={{}}
        />
      )) || (
        <AvatarDisplayComponent
          avatarUuid={avatarUuid}
          width={width}
          height={height}
          style={avatarStyle}
        />
      )}
    </>
  )
}

PersonAvatar.propTypes = {
  avatar: PropTypes.object,
  avatarUuid: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number
}

PersonAvatar.defaultProps = {
  height: 256,
  width: 256
}

export default PersonAvatar
