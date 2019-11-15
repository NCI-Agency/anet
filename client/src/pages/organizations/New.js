import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
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

const OrganizationNew = props => {
  const routerLocation = useLocation()
  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.parentOrgUuid) {
    const queryResult = API.useApiQuery(GQL_GET_ORGANIZATION, {
      uuid: qs.parentOrgUuid
    })
    return (
      <OrganizationNewConditional
        {...props}
        {...queryResult}
        orgUuid={qs.parentOrgUuid}
      />
    )
  }
  return <OrganizationNewConditional {...props} />
}

OrganizationNew.propTypes = {
  ...pagePropTypes
}

const OrganizationNewConditional = props => {
  const { loading, error, data, orgUuid, ...otherProps } = props
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid: orgUuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...otherProps
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
  ...pagePropTypes
}

export default connect(null, mapDispatchToProps)(OrganizationNew)
