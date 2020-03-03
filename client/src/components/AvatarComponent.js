import React from "react"
import Avatar from "react-avatar-edit"
import PropTypes from "prop-types"

// More info about this component: https://github.com/kirill3333/react-avatar
const AvatarComponent = ({ onChangePreview }) => {
  return (
    <span style={{ margin: "0 auto", display: "table", overflow: "scroll" }}>
      <Avatar
        onCrop={onCrop}
        shadingColor="white"
        closeIconColor="black"
        backgroundColor="white"
        imageWidth="512" // image
        width="512" // editor
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
