import React from "react"
import Avatar from "react-avatar-edit"
import DEFAULT_AVATAR from "resources/default_avatar.png"

// More info about this component: https://github.com/kirill3333/react-avatar
export default class AvatarComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      preview: null
    }
  }

  onClose = () => {
    this.setState({ preview: null })
  }

  onCrop = preview => {
    this.setState({ preview })
    this.props.onChangePreview(preview)
  }

  render() {
    let previewImage = null
    if (this.props.showPreview) {
      previewImage = (
        <div style={{ float: "left" }}>
          <div style={{ fontWeight: "bold" }}>Preview</div>
          <img src={this.state.preview} alt="Preview" />
        </div>
      )
    }

    let image =
      this.props.src == null || this.props.src === ""
        ? DEFAULT_AVATAR
        : "data:image/jpeg;base64," + this.props.src

    return (
      <div style={{ display: "inline", margin: "auto" }}>
        <div style={{ float: "rigth" }}>
          <Avatar onCrop={this.onCrop} onClose={this.onClose} />
          {previewImage}
        </div>
      </div>
    )
  }
}
