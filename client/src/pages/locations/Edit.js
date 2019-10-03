import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Location } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import LocationForm from "./Form"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      uuid
      name
      status
      lat
      lng
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const LocationEdit = props => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_LOCATION, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Location",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
  })
  if (done) {
    return result
  }

  const location = new Location(data ? data.location : {})

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

LocationEdit.propTypes = {
  ...pagePropTypes
}

export default connect(
  null,
  mapDispatchToProps
)(LocationEdit)
