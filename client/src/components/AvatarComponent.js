import PropTypes from "prop-types"
import React from "react"
import Avatar from "react-avatar-edit"
import Settings from "settings"

// More info about this component: https://github.com/kirill3333/react-avatar
const AvatarComponent = ({ onChangePreview }) => {
  const imageTypes = Settings.fields.attachment.mimeTypes.filter(mimeType =>
    mimeType.startsWith("image/")
  )
  return (
    <span style={{ margin: "0 auto", display: "table", overflow: "scroll" }}>
      <Avatar
        onCrop={onCrop}
        shadingColor="black"
        closeIconColor="white"
        backgroundColor="white"
        width="512"
        imageWidth="512"
        mimeTypes={imageTypes}
      />
    </span>
  )

  function onCrop(preview) {
    onChangePreview(preview)
  }
}
AvatarComponent.propTypes = {
  onChangePreview: PropTypes.func.isRequired
}

export default AvatarComponent
