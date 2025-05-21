import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import AttachmentTable from "components/Attachment/AttachmentTable"
import Fieldset from "components/Fieldset"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Attachment } from "models"
import React, { useContext, useState } from "react"
import { connect } from "react-redux"

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
            ... on Event {
              name
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
            ... on EventSeries {
              name
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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

interface MyAttachmentsProps {
  pageDispatchers?: PageDispatchersPropType
}

const MyAttachments = ({ pageDispatchers }: MyAttachmentsProps) => {
  const { currentUser } = useContext(AppContext)
  const [pageNum, setPageNum] = useState(0)
  const attachmentQuery = {
    pageNum,
    pageSize: 10,
    authorUuid: currentUser?.uuid
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_ATTACHMENT_LIST, {
    attachmentQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  usePageTitle("My Attachments")
  if (done) {
    return result
  }

  const paginatedAttachments = data.attachmentList
  const attachments = paginatedAttachments ? paginatedAttachments.list : []
  const { pageSize, totalCount } = paginatedAttachments

  return (
    <Fieldset id="my-attachments" title="My Attachments">
      <AttachmentTable
        attachments={attachments}
        pageSize={pageSize}
        pageNum={pageNum}
        totalCount={totalCount}
        goToPage={setPageNum}
      />
    </Fieldset>
  )
}

export default connect(null, mapPageDispatchersToProps)(MyAttachments)
