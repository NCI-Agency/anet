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
  onClick,
  previewStyle,
  captionStyle,
  edit,
  setError,
  uploadedList,
  setUploadedList
}) => {
  const computedCaptionStyle = captionStyle ?? {
    maxWidth: edit ? "201px" : "176px"
  }
  const { backgroundSize, backgroundImage } = utils.getAttachmentIconDetails(
    attachment,
    true
  )

  return (
    <div className="attachment-card" key={attachment.uuid}>
      <Card>
        <div
          className="image-preview info-show card-image"
          style={{
            backgroundSize,
            backgroundImage: `url(${backgroundImage})`,
            ...previewStyle
          }}
          onClick={() => onClick?.(attachment)}
        >
          <div style={{ display: "grid" }}>
            {!onClick && (
              <LinkTo
                className="detail-btn"
                modelType="Attachment"
                model={attachment}
                showIcon={false}
              >
                {" "}
              </LinkTo>
            )}
          </div>
        </div>
        <Card.Body className="p-1 d-block">
          <Card.Title
            title={attachment?.caption || attachment?.fileName}
            style={computedCaptionStyle}
            className="info-line"
          >
            {attachment?.caption || attachment?.fileName}
          </Card.Title>
          {edit && (
            <div className="button-line">
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
  onClick: PropTypes.func,
  previewStyle: PropTypes.object,
  captionStyle: PropTypes.object,
  edit: PropTypes.bool,
  setError: PropTypes.func,
  uploadedList: PropTypes.array,
  setUploadedList: PropTypes.func
}

AttachmentCard.defaultProps = {
  previewStyle: { maxHeight: "155px" }
}

export default AttachmentCard
