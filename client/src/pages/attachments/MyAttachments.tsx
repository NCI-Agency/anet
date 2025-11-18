import {
  gqlAllAttachmentFields,
  gqlAttachmentRelatedObjectsFields,
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import AttachmentTable from "components/Attachment/AttachmentTable"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import React, { useContext, useState } from "react"
import { connect } from "react-redux"

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
