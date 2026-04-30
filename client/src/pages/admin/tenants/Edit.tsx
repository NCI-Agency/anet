import {
  gqlAllTenantFields,
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
import { Tenant } from "models"
import React from "react"
import { legacy_connect as connect } from "react-redux"
import { useParams } from "react-router"
import TenantForm from "./Form"

const GQL_GET_TENANT = gql`
  query ($uuid: String!) {
    tenant(uuid: $uuid) {
      ${gqlAllTenantFields}
      members {
        ${gqlEntityFieldsMap.Person}
        position {
          ${gqlEntityFieldsMap.Position}
          location {
            ${gqlEntityFieldsMap.Location}
          }
          organization {
            ${gqlEntityFieldsMap.Organization}
          }
        }
      }
    }
  }
`

interface TenantEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const TenantEdit = ({ pageDispatchers }: TenantEditProps) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_TENANT, { uuid })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Tenant",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.tenant?.name && `Edit | ${data.tenant.name}`)
  if (done) {
    return result
  }

  const tenant = new Tenant(data ? data.tenant : {})

  return (
    <div>
      <TenantForm edit initialValues={tenant} title={`Tenant ${tenant.name}`} />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(TenantEdit)
