import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { Attachment, Position } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import PositionForm from "./Form"

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
    position(uuid: $uuid) {
      uuid
      name
      code
      status
      type
      superuserType
      role
      description
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      emailAddresses {
        network
        address
      }
      location {
        uuid
        name
      }
      associatedPositions {
        uuid
        name
        type
        role
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      organization {
        uuid
        shortName
        longName
        identificationCode
      }
      person {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
      attachments {
        ${Attachment.basicFieldsQuery}
      }
    }
  }
`

interface PositionEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const PositionEdit = ({ pageDispatchers }: PositionEditProps) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_POSITION, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Position",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.position?.name && `Edit | ${data.position.name}`)
  if (done) {
    return result
  }

  if (data) {
    data.position[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.position.customFields
    )
  }

  const position = new Position(data ? data.position : {})
  // mutates the object
  initInvisibleFields(position, Settings.fields.position.customFields)

  return (
    <div>
      <PositionForm
        edit
        initialValues={position}
        title={`Position ${position.name}`}
        notesComponent={
          <RelatedObjectNotes
            notes={position.notes}
            relatedObject={
              position.uuid && {
                relatedObjectType: Position.relatedObjectType,
                relatedObjectUuid: position.uuid,
                relatedObject: position
              }
            }
          />
        }
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(PositionEdit)
