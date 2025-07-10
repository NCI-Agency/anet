import { gql } from "@apollo/client"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import PositionTable from "components/PositionTable"
import {
  CommonSearchResults,
  GenericSearchResultsWithEmailProps,
  GQL_EMAIL_ADDRESSES
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_POSITION_LIST = gql`
  query ($positionQuery: PositionSearchQueryInput, $emailNetwork: String) {
    positionList(query: $positionQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        code
        type
        role
        status
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ${GQL_EMAIL_ADDRESSES}
        location {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
    }
  }
`

const PositionSearchResults = (props: GenericSearchResultsWithEmailProps) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_POSITION_LIST}
    gqlQueryParamName="positionQuery"
    gqlQueryResultName="positionList"
    tableComponent={PositionTable}
    tableResultsProp="positions"
    tableId="positions-search-results"
    {...props}
    extraProps={{
      showLocation: true
    }}
  />
)

export default PositionSearchResults
