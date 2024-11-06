import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Organization } from "models"
import React from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import OrganizationForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      ascendantOrgs {
        uuid
        app6context
        app6standardIdentity
        app6symbolSet
        parentOrg {
          uuid
        }
      }
    }
  }
`

interface OrganizationNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const OrganizationNew = ({ pageDispatchers }: OrganizationNewProps) => {
  const routerLocation = useLocation()
  usePageTitle("New Organization")
  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.get("parentOrgUuid")) {
    return (
      <OrganizationNewFetchParentOrg
        orgUuid={qs.get("parentOrgUuid")}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return <OrganizationNewConditional pageDispatchers={pageDispatchers} />
}

interface OrganizationNewFetchParentOrgProps {
  orgUuid: string
  pageDispatchers?: PageDispatchersPropType
}

const OrganizationNewFetchParentOrg = ({
  orgUuid,
  pageDispatchers
}: OrganizationNewFetchParentOrgProps) => {
  const queryResult = API.useApiQuery(GQL_GET_ORGANIZATION, {
    uuid: orgUuid
  })
  return (
    <OrganizationNewConditional
      pageDispatchers={pageDispatchers}
      {...queryResult}
      orgUuid={orgUuid}
    />
  )
}

interface OrganizationNewConditionalProps {
  loading?: boolean
  error?: any
  data?: any
  orgUuid?: string
  pageDispatchers?: PageDispatchersPropType
}

const OrganizationNewConditional = ({
  loading,
  error,
  data,
  orgUuid,
  pageDispatchers
}: OrganizationNewConditionalProps) => {
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid: orgUuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const organization = new Organization()
  if (data) {
    organization.parentOrg = new Organization(data.organization)
  }
  // mutates the object
  initInvisibleFields(organization, Settings.fields.organization.customFields)
  return (
    <OrganizationForm
      initialValues={organization}
      title="Create a new Organization"
    />
  )
}

export default connect(null, mapPageDispatchersToProps)(OrganizationNew)
