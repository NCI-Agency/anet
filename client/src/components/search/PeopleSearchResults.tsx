import {
  gqlEmailAddressesForNetworkFields,
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import PersonTable from "components/PersonTable"
import {
  CommonSearchResults,
  GenericSearchResultsWithEmailProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_PERSON_LIST = gql`
  query ($personQuery: PersonSearchQueryInput, $emailNetwork: String) {
    personList(query: $personQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Person}
        ${gqlEmailAddressesForNetworkFields}
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
