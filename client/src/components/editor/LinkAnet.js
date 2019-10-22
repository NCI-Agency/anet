import PropTypes from "prop-types"
import React from "react"
import LinkTo from "components/LinkTo"
import { getPersonByUuid, getOrganizationByUuid } from "utils2"

class LinkAnet extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      person: null
    }

    const { value } = this.props.contentState
      .getEntity(this.props.entityKey)
      .getData()

    this.state.value = value

    console.log("props")
    console.log(this.props)

    console.log(value)

    const splittedUrl = this.state.value.split(/[\\//]/)
    const entityUuid = splittedUrl[splittedUrl.length - 1]
    const entityType = splittedUrl[splittedUrl.length - 2]

    console.log("url: " + this.state.value)
    console.log("entityUuid: " + entityUuid)
    console.log("entityType: " + entityType)

    this.state.uuid = entityUuid
    this.state.type = entityType
  }

  static propTypes = {
    entityKey: PropTypes.string.isRequired,
    contentState: PropTypes.object.isRequired
  }

  componentDidMount() {
    if (this.state.type === "people") {
      getPersonByUuid(this.state.uuid).then(x => this.setState({ person: x }))
    } else if (this.state.type === "organizations") {
      getOrganizationByUuid(this.state.uuid).then(x =>
        this.setState({ organization: x })
      )
    }
  }

  render() {
    return <LinkTo person={this.state.person} />
  }
}

export default LinkAnet
