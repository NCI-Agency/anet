import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import TenantTable from "components/TenantTable"
import { Tenant } from "models"
import React, { useContext } from "react"
import { legacy_connect as connect } from "react-redux"
import { Link } from "react-router"

const GQL_GET_TENANT_LIST = gql`
  query {
    tenantList {
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
`
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

interface TenantsListProps {
  pageDispatchers?: PageDispatchersPropType
}

const TenantsList = ({ pageDispatchers }: TenantsListProps) => {
  const { currentUser } = useContext(AppContext)
  const isAdmin = currentUser?.isAdmin()
  const { loading, error, data } = API.useApiQuery(
    isAdmin ? GQL_GET_TENANT_LIST : GQL_GET_MY_TENANTS
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(isAdmin ? "Tenants" : "My Tenant")
  if (done) {
    return result
  }
  const tenants =
    (isAdmin ? data?.tenantList : data?.me?.position?.tenantsAdministrated) ??
    []
  return (
    <Fieldset
      id="tenantList"
      title={isAdmin ? "Tenants" : "Tenant I administrate"}
      action={
        isAdmin && (
          <Link
            id="newTenants"
            to={Tenant.pathForNew()}
            className="btn btn-primary"
          >
            New tenant
          </Link>
        )
      }
    >
      <TenantTable
        tenants={tenants}
        showLink
        showStatus
        showAccessRequestsCount
        showMembersCount
      />
    </Fieldset>
  )
}

export default connect(null, mapPageDispatchersToProps)(TenantsList)
