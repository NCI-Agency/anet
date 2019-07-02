import React from "react"
import DEFAULT_AVATAR from "resources/default_avatar.png"

export default class AvatarDisplayComponent extends React.Component {
  render() {
    let image =
      this.props.avatar == null || this.props.avatar === ""
        ? DEFAULT_AVATAR
        : "data:image/jpeg;base64," + this.props.avatar
    return (
      <img src={image} height={this.props.height} width={this.props.height} />
    )
  }
}
