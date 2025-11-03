import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
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
import React from "react"
import { connect } from "react-redux"
import { useLocation } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import PositionForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      ${gqlEntityFieldsMap.Organization}
    }
  }
`

interface PositionNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const PositionNew = ({ pageDispatchers }: PositionNewProps) => {
  const routerLocation = useLocation()
  usePageTitle("New Position")
  const qs = utils.parseQueryString(routerLocation.search)
  if (qs.get("organizationUuid")) {
    return (
      <PositionNewFetchOrg
        orgUuid={qs.get("organizationUuid")}
        pageDispatchers={pageDispatchers}
      />
    )
  }
  return <PositionNewConditional pageDispatchers={pageDispatchers} />
}

interface PositionNewFetchOrgProps {
  orgUuid: string
  pageDispatchers?: PageDispatchersPropType
}

const PositionNewFetchOrg = ({
  orgUuid,
  pageDispatchers
}: PositionNewFetchOrgProps) => {
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

interface PositionNewConditionalProps {
  loading?: boolean
  error?: any
  data?: any
  orgUuid?: string
  pageDispatchers?: PageDispatchersPropType
}

const PositionNewConditional = ({
  loading,
  error,
  data,
  orgUuid,
  pageDispatchers
}: PositionNewConditionalProps) => {
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

export default connect(null, mapPageDispatchersToProps)(PositionNew)
