import {
  gqlAllAuthorizationGroupFields,
  gqlAuthorizationGroupMembersFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
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
      ${gqlAllAuthorizationGroupFields}
      administrativePositions {
        ${gqlEntityFieldsMap.Position}
        location {
          ${gqlEntityFieldsMap.Location}
        }
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
        person {
          ${gqlEntityFieldsMap.Person}
        }
      }
      ${gqlAuthorizationGroupMembersFields}
    }

    reportList(query: { authorizationGroupUuid: [$uuid], pageSize: 1 }) {
      totalCount
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
  const hasReports = !!data?.reportList?.totalCount

  return (
    <div>
      <AuthorizationGroupForm
        edit
        initialValues={authorizationGroup}
        title={`Community ${authorizationGroup.name}`}
        hasReports={hasReports}
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(AuthorizationGroupEdit)
