import PropTypes from "prop-types"
import React from "react"
import Avatar from "react-avatar-edit"

// More info about this component: https://github.com/kirill3333/react-avatar
const AvatarComponent = ({ onChangePreview }) => {
  return (
    <span style={{ margin: "0 auto", display: "table", overflow: "scroll" }}>
      <Avatar
        onCrop={onCrop}
        shadingColor="black"
        closeIconColor="white"
        backgroundColor="white"
        width="512"
        imageWidth="512" // image
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
