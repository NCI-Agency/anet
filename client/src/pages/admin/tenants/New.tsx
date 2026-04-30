import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Tenant } from "models"
import React from "react"
import { legacy_connect as connect } from "react-redux"
import TenantForm from "./Form"

interface TenantNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const TenantNew = ({ pageDispatchers }: TenantNewProps) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Tenant")

  const tenant = new Tenant()

  return (
    <div>
      <TenantForm initialValues={tenant} title="Create a new Tenant" />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(TenantNew)
