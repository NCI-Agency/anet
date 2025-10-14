import { gql } from "@apollo/client"
import AttachmentTable from "components/Attachment/AttachmentTable"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  CommonSearchResults,
  GenericSearchResultsProps
} from "components/search/CommonSearchResults"
import { Attachment } from "models"
import React from "react"

const GQL_GET_ATTACHMENT_LIST = gql`
  query ($attachmentQuery: AttachmentSearchQueryInput) {
    attachmentList(query: $attachmentQuery) {
      totalCount
      pageNum
      pageSize
      list {
        ${Attachment.basicFieldsQuery}
        author {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        attachmentRelatedObjects {
          relatedObject {
            ... on AuthorizationGroup {
              name
            }
            ... on Location {
              name
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on Organization {
              shortName
              longName
              identificationCode
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on Person {
              name
              rank
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on Position {
              type
              name
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on Report {
              intent
            }
            ... on Task {
              shortName
              longName
            }
          }
          relatedObjectUuid
          relatedObjectType
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
