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
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        location {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Position {
            uuid
            type
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
    }
  }
`

interface AuthorizationGroupEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const AuthorizationGroupEdit = ({
  pageDispatchers
}: AuthorizationGroupEditProps) => {
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
        title={`Community ${authorizationGroup.name}`}
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupEdit)
