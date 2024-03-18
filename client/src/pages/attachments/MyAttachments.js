import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import AttachmentImage from "components/Attachment/AttachmentImage"
import AttachmentRelatedObjectsTable from "components/Attachment/AttachmentRelatedObjectsTable"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import { Attachment } from "models"
import React, { useContext, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import utils from "utils"

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
          avatarUuid
        }
        attachmentRelatedObjects {
          relatedObject {
            ... on AuthorizationGroup {
              name
            }
            ... on Location {
              name
            }
            ... on Organization {
              shortName
              longName
              identificationCode
            }
            ... on Person {
              name
              rank
              avatarUuid
            }
            ... on Position {
              type
              name
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

const MyAttachments = ({ pageDispatchers }) => {
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
  const attachmentsExist = totalCount > 0

  return (
    <Fieldset id="my-attachments" title="My Attachments">
      {attachmentsExist ? (
        <div>
          <UltimatePagination
            Component="header"
            componentClassName="searchPagination"
            className="float-end"
            pageNum={pageNum}
            pageSize={pageSize}
            totalCount={totalCount}
            goToPage={setPageNum}
          />

          <Table striped hover responsive className="attachments_table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Caption</th>
                <th>Used In</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map(attachment => {
                const { backgroundSize, backgroundImage, contentMissing } =
                  utils.getAttachmentIconDetails(attachment, true)
                return (
                  <tr key={attachment.uuid}>
                    <td>
                      <div style={{ width: "50px", height: "50px" }}>
                        <AttachmentImage
                          uuid={attachment.uuid}
                          contentMissing={contentMissing}
                          backgroundSize={backgroundSize}
                          backgroundImage={backgroundImage}
                        />
                      </div>
                    </td>
                    <td>
                      <LinkTo modelType="Attachment" model={attachment} />
                    </td>
                    <td>
                      <AttachmentRelatedObjectsTable
                        relatedObjects={attachment.attachmentRelatedObjects}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <em>No attachments found</em>
      )}
    </Fieldset>
  )
}

MyAttachments.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MyAttachments)
