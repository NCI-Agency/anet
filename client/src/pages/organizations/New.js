import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { Organization } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import utils from "utils"
import OrganizationForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      type
    }
  }
`

const OrganizationNew = ({ pageDispatchers }) => {
  const routerLocation = useLocation()
  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.parentOrgUuid) {
    return (
      <OrganizationNewFetchParentOrg
        orgUuid={qs.parentOrgUuid}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return <OrganizationNewConditional pageDispatchers={pageDispatchers} />
}

OrganizationNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

const OrganizationNewFetchParentOrg = ({ orgUuid, pageDispatchers }) => {
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

OrganizationNewFetchParentOrg.propTypes = {
  orgUuid: PropTypes.string.isRequired,
  pageDispatchers: PageDispatchersPropType
}

const OrganizationNewConditional = ({
  loading,
  error,
  data,
  orgUuid,
  pageDispatchers
}) => {
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
    organization.type = organization.parentOrg.type
  }

  return (
    <OrganizationForm
      initialValues={organization}
      title="Create a new Organization"
    />
  )
}

OrganizationNewConditional.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  data: PropTypes.object,
  orgUuid: PropTypes.string,
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(OrganizationNew)
