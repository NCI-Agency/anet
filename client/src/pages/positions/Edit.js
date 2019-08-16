import { PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Position } from "models"
import React from "react"
import { connect } from "react-redux"
import PositionForm from "./Form"

class PositionEdit extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  static modelName = "Position"

  state = {
    position: new Position()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  fetchData(props) {
    return API.query(
      /* GraphQL */ `
        position(uuid: $uuid) {
          uuid
          name
          code
          status
          type
          location {
            uuid
            name
          }
          associatedPositions {
            uuid
            name
            type
            person {
              uuid
              name
              rank
              role
            }
          }
          organization {
            uuid
            shortName
            longName
            identificationCode
            type
          }
          person {
            uuid
            name
            rank
            role
          }
          ${GRAPHQL_NOTES_FIELDS}
        }
      `,
      { uuid: props.match.params.uuid },
      "($uuid: String!)"
    ).then(data => {
      this.setState({ position: new Position(data.position) })
    })
  }

  render() {
    const { position } = this.state
    return (
      <div>
        <RelatedObjectNotes
          notes={position.notes}
          relatedObject={
            position.uuid && {
              relatedObjectType: "positions",
              relatedObjectUuid: position.uuid
            }
          }
        />
        <PositionForm
          edit
          initialValues={position}
          title={`Position ${position.name}`}
        />
      </div>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(PositionEdit)
