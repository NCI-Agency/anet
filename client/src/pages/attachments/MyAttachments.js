import { gql } from "@apollo/client"
import API from "api"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePagination from "components/UltimatePagination"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import utils from "utils"

const GQL_GET_MY_ATTACHMENTS = gql`
  query ($attachmentsQuery: AttachmentSearchQueryInput) {
    myAttachments(query: $attachmentsQuery) {
      totalCount
      pageNum
      pageSize
      list {
        uuid
        fileName
        caption
        contentLength
        mimeType
        classification
        description
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
            }
          }
          relatedObjectUuid
          relatedObjectType
        }
      }
    }
  }
`

const MyAttachments = ({
  forceRefetch,
  setForceRefetch,
  refetchCallback,
  pageDispatchers
}) => {
  const [pageNum, setPageNum] = useState(0)
  const attachmentsQuery = {
    pageNum,
    pageSize: 10
  }
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_MY_ATTACHMENTS,
    {
      attachmentsQuery
    }
  )
  useEffect(() => {
    if (forceRefetch) {
      setForceRefetch(false)
      refetch()
    }
  }, [forceRefetch, setForceRefetch, refetch])
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  usePageTitle("My Attachments")
  if (done) {
    return result
  }

  const paginatedAttachments = data.myAttachments
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
                <th>Name</th>
                <th>Caption</th>
                <th>Used In</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map(attachment => {
                const { backgroundImage } = utils.getAttachmentIconDetails(
                  attachment,
                  true
                )
                return (
                  <tr key={attachment.uuid}>
                    <td>
                      <div
                        key={attachment.id}
                        style={{
                          backgroundSize: "cover",
                          height: "40px",
                          width: "40px",
                          backgroundPosition: "center",
                          backgroundImage: `url(${backgroundImage})`,
                          backgroundRepeat: "no-repeat"
                        }}
                      />
                    </td>
                    <td>
                      <LinkTo modelType="Attachment" model={attachment}>
                        {attachment.fileName}
                      </LinkTo>
                    </td>
                    <td>{attachment.caption}</td>
                    <td>
                      {attachment.attachmentRelatedObjects[0] ? (
                        <LinkTo
                          modelType={
                            attachment.attachmentRelatedObjects[0]
                              .relatedObjectType
                          }
                          model={{
                            uuid: attachment.attachmentRelatedObjects[0]
                              .relatedObjectUuid,
                            ...attachment.attachmentRelatedObjects[0]
                              .relatedObject
                          }}
                        />
                      ) : (
                        <>No linked objects</>
                      )}
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
  forceRefetch: PropTypes.bool.isRequired,
  setForceRefetch: PropTypes.func.isRequired,
  refetchCallback: PropTypes.func.isRequired,
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MyAttachments)
