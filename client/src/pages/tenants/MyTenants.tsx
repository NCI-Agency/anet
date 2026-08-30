import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import TenantTable from "components/TenantTable"
import React from "react"
import { legacy_connect as connect } from "react-redux"

const GQL_GET_MY_TENANTS = gql`
  query {
    me {
      uuid
      position {
        tenantsAdministrated {
          ${gqlEntityFieldsMap.Tenant}
          accessRequests {
            uuid
          }
          members {
            uuid
            status
          }
        }
      }
    }
  }
`

interface MyTenantsProps {
  pageDispatchers?: PageDispatchersPropType
}

const MyTenants = ({ pageDispatchers }: MyTenantsProps) => {
  const { loading, error, data } = API.useApiQuery(GQL_GET_MY_TENANTS)
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("My Tenants")
  if (done) {
    return result
  }

  const tenantsAdministrated = data?.me?.position?.tenantsAdministrated || []

  return (
    <Fieldset id="my-tenants" title="Tenants I administrate">
      <TenantTable
        tenants={tenantsAdministrated}
        showLink
        showStatus
        showAccessRequestsCount
        showMembersCount
      />
    </Fieldset>
  )
}

export default connect(null, mapPageDispatchersToProps)(MyTenants)
