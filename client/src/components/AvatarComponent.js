import React, { useState } from "react"
import Avatar from "react-avatar-edit"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import PropTypes from "prop-types"

// More info about this component: https://github.com/kirill3333/react-avatar
const AvatarComponent = ({
  onChangePreview,
  src,
  editCurrent,
  showPreview
}) => {
  const [preview, setPreview] = useState(null)

  const previewImage = showPreview && (
    <div style={{ float: "left" }}>
      <div style={{ fontWeight: "bold" }}>Preview</div>
      <img src={preview} alt="Preview" />
    </div>
  )
  const image =
    editCurrent &&
    (src === null || src === ""
      ? DEFAULT_AVATAR
      : "data:image/jpeg;base64," + src)

  return (
    <span style={{ margin: "0 auto", display: "table", overflow: "scroll" }}>
      <Avatar
        onCrop={onCrop}
        onClose={onClose}
        src={image}
        shadingColor="white"
        closeIconColor="black"
        backgroundColor="white"
        imageWidth="512" // image
        width="512" // editor
      />
      {previewImage}
    </span>
  )

  function onClose() {
    setPreview(null)
  }

  function onCrop(preview) {
    setPreview(preview)
    onChangePreview(preview)
  }
}
AvatarComponent.propTypes = {
  onChangePreview: PropTypes.func.isRequired,
  src: PropTypes.string,
  editCurrent: PropTypes.bool,
  showPreview: PropTypes.bool
}

export default AvatarComponent
