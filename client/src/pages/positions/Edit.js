import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Position } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import PositionForm from "./Form"

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
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
          avatar(size: 32)
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
        avatar(size: 32)
      }
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const PositionEdit = ({ pageDispatchers }) => {
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
  if (done) {
    return result
  }

  const position = new Position(data ? data.position : {})

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

PositionEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PositionEdit)
