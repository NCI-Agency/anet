import AttachmentImage from "components/Attachment/AttachmentImage"
import AttachmentRelatedObjectsTable from "components/Attachment/AttachmentRelatedObjectsTable"
import LinkTo from "components/LinkTo"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import moment from "moment"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

interface AttachmentTableProps {
  id?: string
  // list of attachments:
  attachments: any[]
  // fill these when pagination wanted:
  totalCount?: number
  pageNum?: number
  pageSize?: number
  goToPage?: (...args: unknown[]) => unknown
  showOwner?: boolean
}

const AttachmentTable = ({
  id,
  attachments,
  pageSize,
  pageNum,
  totalCount,
  goToPage,
  showOwner
}: AttachmentTableProps) => {
  if (_get(attachments, "length", 0) === 0) {
    return <em>No attachments found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        Component="header"
        componentClassName="searchPagination"
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table striped hover responsive id={id} className="attachments_table">
          <thead>
            <tr>
              <th>Content</th>
              <th>Caption</th>
              <th>{Settings.confidentialityLabel.label}</th>
              <th>Used In</th>
              {showOwner && <th>Owner</th>}
              <th>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {attachments.map(attachment => {
              const { iconSize, iconImage, contentMissing } =
                utils.getAttachmentIconDetails(attachment, true)
              return (
                <tr key={attachment.uuid}>
                  <td>
                    <div style={{ width: "50px", height: "50px" }}>
                      <AttachmentImage
                        uuid={attachment.uuid}
                        caption={attachment.caption}
                        contentMissing={contentMissing}
                        iconSize={iconSize}
                        iconImage={iconImage}
                      />
                    </div>
                  </td>
                  <td>
                    <LinkTo
                      modelType="Attachment"
                      model={attachment}
                      showIcon={false}
                    />
                  </td>
                  <td>
                    {utils.getConfidentialityLabelForChoice(
                      attachment.classification
                    )}
                  </td>
                  <td>
                    <AttachmentRelatedObjectsTable
                      relatedObjects={attachment.attachmentRelatedObjects}
                    />
                  </td>
                  {showOwner && (
                    <td>
                      <LinkTo modelType="Person" model={attachment.author} />
                    </td>
                  )}
                  <td>
                    <span>
                      {moment(attachment.createdAt).format(
                        Settings.dateFormats.forms.displayShort.withTime
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

export default AttachmentTable
