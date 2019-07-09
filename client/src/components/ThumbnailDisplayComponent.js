import React from "react"
import API from "api"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import PropTypes from "prop-types"

export default class ThumbnailDisplayComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentThumbnail: null
    }
  }

  static propTypes = {
    personUuid: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired
  }

  componentDidMount() {
    API.query(
      /* GraphQL */ `
        thumbnail(uuid: "${this.props.personUuid}", size: "${this.props.size}")
        `
    ).then(data => {
      this.setState({ currentThumbnail: data.thumbnail })
    })
  }

  render() {
    return (
      <AvatarDisplayComponent
        avatar={this.state.currentThumbnail}
        height={this.props.size}
        width={this.props.size}
      />
    )
  }
}
