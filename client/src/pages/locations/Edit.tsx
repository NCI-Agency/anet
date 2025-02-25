import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { Attachment, Location } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import LocationForm from "./Form"

const GQL_GET_LOCATION = gql`
  query($uuid: String!) {
    location(uuid: $uuid) {
      ${Location.allFieldsQuery}
      attachments {
        ${Attachment.basicFieldsQuery}
      }
    }
  }
`

interface LocationEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const LocationEdit = ({ pageDispatchers }: LocationEditProps) => {
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
  usePageTitle(data?.location?.name && `Edit | ${data.location.name}`)
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
      <LocationForm
        edit
        initialValues={location}
        title={`Location ${location.name}`}
        notesComponent={
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
        }
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(LocationEdit)
