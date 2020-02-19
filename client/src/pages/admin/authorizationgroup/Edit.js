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
import { AuthorizationGroup } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import AuthorizationGroupForm from "./Form"

const GQL_GET_AUTHORIZATION_GROUP = gql`
  query($uuid: String!) {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      positions {
        uuid
        name
        code
        type
        status
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      status
      ${GRAPHQL_NOTES_FIELDS}
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
  if (done) {
    return result
  }

  const authorizationGroup = new AuthorizationGroup(
    data ? data.authorizationGroup : {}
  )

  return (
    <div>
      <RelatedObjectNotes
        notes={authorizationGroup.notes}
        relatedObject={
          authorizationGroup.uuid && {
            relatedObjectType: "authorizationGroups",
            relatedObjectUuid: authorizationGroup.uuid
          }
        }
      />
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
