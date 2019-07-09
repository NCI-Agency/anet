import React from "react"
import API from "api"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"

export default class ThumbnailDisplayComponent extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      currentThumbnail: null
    }
  }

  componentDidMount() {
    API.query(
        /* GraphQL */ `
        thumbnail(uuid: "${this.props.personUuid}", size: "${this.props.thumbnailSize}")
        `
    ).then(data => {
        this.setState({currentThumbnail: data.thumbnail})
    })
  }

  render() {   
    return (
        <AvatarDisplayComponent
            avatar={this.state.currentThumbnail}
            height={this.props.thumbnailSize}
            width={this.props.thumbnailSize}
        />
    )
  }
}
