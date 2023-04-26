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
import { Organization, Position } from "models"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import PositionForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
    }
  }
`

const PositionNew = ({ pageDispatchers }) => {
  const routerLocation = useLocation()
  usePageTitle("New Position")
  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.organizationUuid) {
    return (
      <PositionNewFetchOrg
        orgUuid={qs.organizationUuid}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return <PositionNewConditional pageDispatchers={pageDispatchers} />
}

PositionNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

const PositionNewFetchOrg = ({ orgUuid, pageDispatchers }) => {
  // If an organizationUuid was given in query parameters,
  // then look that org up and pre-populate the field.
  const queryResult = API.useApiQuery(GQL_GET_ORGANIZATION, {
    uuid: orgUuid
  })
  return (
    <PositionNewConditional
      pageDispatchers={pageDispatchers}
      {...queryResult}
      orgUuid={orgUuid}
    />
  )
}

PositionNewFetchOrg.propTypes = {
  orgUuid: PropTypes.string.isRequired,
  pageDispatchers: PageDispatchersPropType
}

const PositionNewConditional = ({
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

  const position = new Position()
  if (data) {
    const organization = new Organization(data.organization)
    position.organization = organization
    position.type = Position.TYPE.REGULAR
  }

  // mutates the object
  initInvisibleFields(position, Settings.fields.position.customFields)

  return <PositionForm initialValues={position} title="Create a new Position" />
}

PositionNewConditional.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  data: PropTypes.object,
  orgUuid: PropTypes.string,
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PositionNew)
