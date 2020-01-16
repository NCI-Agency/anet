import PropTypes from "prop-types"
import React from "react"
import LinkTo from "components/LinkTo"
import { getEntityByUuid, getEntityInfoFromUrl } from "utils_links"

class LinkAnetEntity extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      entity: null
    }

    const url = props.url || this.props.contentState
      .getEntity(this.props.entityKey)
      .getData().value

    const { type, uuid } = getEntityInfoFromUrl(url)
    this.state.uuid = uuid
    this.state.type = type
  }

  static propTypes = {
    url: PropTypes.string,
    entityKey: PropTypes.string,
    contentState: PropTypes.object,
    children: PropTypes.any
  }

  componentDidMount() {
    getEntityByUuid(this.state.type, this.state.uuid).then(x => this.setState({ entity: x }))
  }

  render() {
    const {
      children
    } = this.props

    return <LinkTo modelType={this.state.type} model={this.state.entity}>{children}</LinkTo>
  }
}

export default LinkAnetEntity
