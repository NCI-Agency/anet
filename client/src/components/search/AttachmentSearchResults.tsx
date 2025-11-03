import {
  gqlAllAttachmentFields,
  gqlAttachmentRelatedObjectsFields,
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import AttachmentTable from "components/Attachment/AttachmentTable"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import React from "react"

const GQL_GET_ATTACHMENT_LIST = gql`
  query ($attachmentQuery: AttachmentSearchQueryInput) {
    attachmentList(query: $attachmentQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlAllAttachmentFields}
        ${gqlAttachmentRelatedObjectsFields}
        author {
          ${gqlEntityFieldsMap.Person}
        }
      }
    }
  }
`

const AttachmentSearchResults = (props: GenericSearchResultsProps) => (
  <CommonSearchResults
    gqlQuery={GQL_GET_ATTACHMENT_LIST}
    gqlQueryParamName="attachmentQuery"
    gqlQueryResultName="attachmentList"
    tableComponent={AttachmentTable}
    tableResultsProp="attachments"
    tableId="attachments-search-results"
    {...props}
    extraProps={{
      showOwner: true
    }}
  />
)

export default AttachmentSearchResults
