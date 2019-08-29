import API from "api"
import { gql } from "apollo-boost"
import Fieldset from "components/Fieldset"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import React from "react"
import { connect } from "react-redux"
import AuthorizationGroupTable from "./AuthorizationGroupTable"

const GQL_GET_AUTHORIZATION_GROUP_LIST = gql`
  query($query: AuthorizationGroupSearchQueryInput) {
    authorizationGroupList(query: $query) {
      list {
        uuid
        name
        description
        positions {
          uuid
          name
          type
        }
        status
      }
    }
  }
`

const AuthorizationGroups = props => {
  const query = {
    pageSize: 0 // retrieve all
  }
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_AUTHORIZATION_GROUP_LIST,
    {
      query
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const authorizationGroups = data ? data.authorizationGroupList.list : []

  return (
    <div>
      <Fieldset title="Authorization Groups">
        <AuthorizationGroupTable authorizationGroups={authorizationGroups} />
      </Fieldset>
    </div>
  )
}

AuthorizationGroups.propTypes = { ...pagePropTypes }

export default connect(
  null,
  mapDispatchToProps
)(AuthorizationGroups)
