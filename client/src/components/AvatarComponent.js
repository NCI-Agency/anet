import React from "react"
import Avatar from "react-avatar-edit"
import DEFAULT_AVATAR from "resources/default_avatar.svg"
import PropTypes from "prop-types"

// More info about this component: https://github.com/kirill3333/react-avatar
export default class AvatarComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      preview: null
    }
  }

  static propTypes = {
    onChangePreview: PropTypes.func.isRequired,
    src: PropTypes.string,
    editCurrent: PropTypes.bool,
    showPreview: PropTypes.bool
  }

  onClose = () => {
    this.setState({ preview: null })
  }

  onCrop = preview => {
    this.setState({ preview })
    this.props.onChangePreview(preview)
  }

  render() {
    const previewImage = this.props.showPreview && (
      <div style={{ float: "left" }}>
        <div style={{ fontWeight: "bold" }}>Preview</div>
        <img src={this.state.preview} alt="Preview" />
      </div>
    )

    const image =
      this.props.editCurrent &&
      (this.props.src === null || this.props.src === ""
        ? DEFAULT_AVATAR
        : "data:image/jpeg;base64," + this.props.src)

    return (
      <span style={{ margin: "0 auto", display: "table", overflow: "scroll" }}>
        <Avatar
          onCrop={this.onCrop}
          onClose={this.onClose}
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
  }
}
