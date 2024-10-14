import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { AuthorizationGroup } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import AuthorizationGroupForm from "./Form"

const GQL_GET_AUTHORIZATION_GROUP = gql`
  query ($uuid: String!) {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      status
      administrativePositions {
        uuid
        name
        code
        type
        role
        status
        location {
          uuid
          name
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        person {
          uuid
          name
          rank
          avatarUuid
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      authorizationGroupRelatedObjects {
        relatedObjectType
        relatedObjectUuid
        relatedObject {
          ... on Organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Person {
            uuid
            name
            rank
            avatarUuid
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Position {
            uuid
            type
            name
          }
        }
      }
    }
  }
`

const AuthorizationGroupEdit = ({ pageDispatchers }) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_AUTHORIZATION_GROUP,
    { uuid }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "AuthorizationGroup",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(
    data?.authorizationGroup?.name && `Edit | ${data.authorizationGroup.name}`
  )
  if (done) {
    return result
  }

  const authorizationGroup = new AuthorizationGroup(
    data ? data.authorizationGroup : {}
  )

  return (
    <div>
      <AuthorizationGroupForm
        edit
        initialValues={authorizationGroup}
        title={`Authorization Group ${authorizationGroup.name}`}
      />
    </div>
  )
}

AuthorizationGroupEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupEdit)
