import { gql } from "@apollo/client"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import PersonTable from "components/PersonTable"
import {
  CommonSearchResults,
  GenericSearchResultsWithEmailProps,
  GQL_EMAIL_ADDRESSES
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_PERSON_LIST = gql`
  query ($personQuery: PersonSearchQueryInput, $emailNetwork: String) {
    personList(query: $personQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        ${GQL_EMAIL_ADDRESSES}
        position {
          uuid
          name
          type
          role
          code
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
        }
      }
    }
  }
`

const PeopleSearchResults = (props: GenericSearchResultsWithEmailProps) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_PERSON_LIST}
    gqlQueryParamName="personQuery"
    gqlQueryResultName="personList"
    tableComponent={PersonTable}
    tableResultsProp="people"
    tableId="people-search-results"
    {...props}
  />
)

export default PeopleSearchResults
