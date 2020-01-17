import PropTypes from "prop-types"
import React from "react"
import LinkTo from "components/LinkTo"
import { getEntityByUuid } from "utils_links"

class LinkAnetEntity extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      entity: null
    }

    this.state.type = props.type
    this.state.uuid = props.uuid
  }

  static propTypes = {
    type: PropTypes.string,
    uuid: PropTypes.string,
    children: PropTypes.any
  }

  componentDidMount() {
    getEntityByUuid(this.state.type, this.state.uuid).then(x =>
      this.setState({ entity: x })
    )
  }

  render() {
    return (
      <LinkTo modelType={this.state.type} model={this.state.entity}>
        {this.props.children}
      </LinkTo>
    )
  }
}

export default LinkAnetEntity
