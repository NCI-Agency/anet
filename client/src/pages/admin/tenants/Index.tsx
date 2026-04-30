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
import { Tenant } from "models"
import React from "react"
import { legacy_connect as connect } from "react-redux"
import { Link } from "react-router"

const GQL_GET_TENANT_LIST = gql`
  query {
    tenantList {
      ${gqlEntityFieldsMap.Tenant}
      members {
        uuid
        status
      }
    }
  }
`

interface TenantsListProps {
  pageDispatchers?: PageDispatchersPropType
}

const TenantsList = ({ pageDispatchers }: TenantsListProps) => {
  const { loading, error, data } = API.useApiQuery(GQL_GET_TENANT_LIST)
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Tenants")
  if (done) {
    return result
  }
  return (
    <Fieldset
      id="tenantList"
      title="Tenants"
      action={
        <Link
          id="newTenants"
          to={Tenant.pathForNew()}
          className="btn btn-primary"
        >
          New tenant
        </Link>
      }
    >
      <TenantTable
        tenants={data?.tenantList}
        showLink
        showStatus
        showMembersCount
      />
    </Fieldset>
  )
}

export default connect(null, mapPageDispatchersToProps)(TenantsList)
