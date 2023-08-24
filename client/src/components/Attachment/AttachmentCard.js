import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Card } from "react-bootstrap"
import { toast } from "react-toastify"
import utils from "utils"
import "./Attachment.css"

const GQL_DELETE_ATTACHMENT = gql`
  mutation ($uuid: String!) {
    deleteAttachment(uuid: $uuid)
  }
`

const AttachmentCard = ({
  attachment,
  edit,
  remove,
  setError,
  setRemove,
  uploadedList,
  setUploadedList
}) => {
  const { backgroundSize, backgroundImage } = utils.getAttachmentIconDetails(
    attachment,
    true
  )

  return (
    <div className="attachmentCard" key={attachment.uuid}>
      <Card>
        <div
          className="image-preview info-show card-image"
          style={{
            backgroundSize,
            backgroundImage: `url(${backgroundImage})`
          }}
        >
          <div className="file-info image-info">
            <div style={{ display: "grid" }}>
              <LinkTo
                className="detail-btn"
                modelType="Attachment"
                model={attachment}
              >
                {" "}
              </LinkTo>
            </div>
          </div>
        </div>
        <Card.Body className="p-1 d-block">
          <Card.Title style={{ fontSize: "15px" }} className="info-line">
            {utils.ellipsize(attachment?.fileName, 8)}
            <span>
              {utils.humanReadableFileSize(attachment?.contentLength)}
            </span>
          </Card.Title>
          {edit && (
            <div className="info-line">
              <div>
                <LinkTo
                  modelType="Attachment"
                  edit
                  model={attachment}
                  button="outline-primary"
                >
                  <Icon icon={IconNames.EDIT} className="icon edit" />
                </LinkTo>
              </div>
              <ConfirmDestructive
                onConfirm={() => deleteAttachment(attachment)}
                objectType="attachment"
                objectDisplay={"#" + attachment.uuid}
                title="Delete attachment"
                variant="outline-danger"
                buttonSize="xs"
              >
                <Icon icon={IconNames.TRASH} />
              </ConfirmDestructive>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )

  function deleteAttachment(attachment) {
    const newAttachments = uploadedList.filter(
      item => item.uuid !== attachment.uuid
    )
    API.mutation(GQL_DELETE_ATTACHMENT, { uuid: attachment.uuid })
      .then(data => {
        setUploadedList(newAttachments)
        if (!remove) {
          setRemove(true)
        }
        toast.success(
          `Your attachment ${attachment.fileName} has been successfully deleted`
        )
      })
      .catch(error => {
        setError(error)
      })
  }
}

AttachmentCard.propTypes = {
  attachment: PropTypes.object,
  edit: PropTypes.bool,
  remove: PropTypes.bool,
  setError: PropTypes.func,
  setRemove: PropTypes.func,
  uploadedList: PropTypes.array,
  setUploadedList: PropTypes.func
}

AttachmentCard.defaultProps = {
  edit: true,
  remove: undefined
}

export default AttachmentCard
