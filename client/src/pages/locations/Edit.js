import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { initInvisibleFields } from "components/CustomFields"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Location } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import LocationForm from "./Form"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      uuid
      name
      status
      lat
      lng
      planningApprovalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            role
            avatar(size: 32)
          }
        }
      }
      approvalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            role
            avatar(size: 32)
          }
        }
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const LocationEdit = ({ pageDispatchers }) => {
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
    pageDispatchers
  })
  if (done) {
    return result
  }
  if (data) {
    data.location[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.location.customFields
    )
  }
  const location = new Location(data ? data.location : {})
  // mutates the object
  initInvisibleFields(location, Settings.fields.location.customFields)

  return (
    <div>
      <RelatedObjectNotes
        notes={location.notes}
        relatedObject={
          location.uuid && {
            relatedObjectType: Location.relatedObjectType,
            relatedObjectUuid: location.uuid,
            relatedObject: location
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
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(LocationEdit)
