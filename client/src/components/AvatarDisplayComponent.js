import React from "react"
import DEFAULT_AVATAR from "resources/default_avatar.png"
import PropTypes from "prop-types"

export default class AvatarDisplayComponent extends React.Component {
  static propTypes = {
    avatar: PropTypes.string.isRequired,
    height: PropTypes.string,
    width: PropTypes.string
  }

  render() {
    let image =
      this.props.avatar == null || this.props.avatar === ""
        ? DEFAULT_AVATAR
        : "data:image/jpeg;base64," + this.props.avatar

    return (
      <img
        src={image}
        height={this.props.height}
        width={this.props.width}
        alt="Avatar"
      />
    )
  }
}
