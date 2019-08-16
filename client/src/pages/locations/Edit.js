import { PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Location } from "models"
import React from "react"
import { connect } from "react-redux"
import LocationForm from "./Form"

class LocationEdit extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  static modelName = "Location"

  state = {
    location: new Location()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  fetchData(props) {
    return API.query(
      /* GraphQL */ `
        location(uuid: $uuid) {
          uuid
          name
          status
          lat
          lng
          ${GRAPHQL_NOTES_FIELDS}
        }
      `,
      { uuid: props.match.params.uuid },
      "($uuid: String!)"
    ).then(data => {
      this.setState({ location: new Location(data.location) })
    })
  }

  render() {
    const { location } = this.state
    return (
      <div>
        <RelatedObjectNotes
          notes={location.notes}
          relatedObject={
            location.uuid && {
              relatedObjectType: "locations",
              relatedObjectUuid: location.uuid
            }
          }
        />
        <LocationForm
          edit
          initialValues={location}
          title={`Location ${location.name}`}
        />
      </div>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(LocationEdit)
