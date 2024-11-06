import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import LinkTo from "components/LinkTo"
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

interface AttachmentCardProps {
  attachment?: any
  onClick?: (...args: unknown[]) => unknown
  captionStyle?: any
  edit?: boolean
  setError?: (...args: unknown[]) => unknown
  uploadedList?: any[]
  setUploadedList?: (...args: unknown[]) => unknown
}

const AttachmentCard = ({
  attachment,
  onClick,
  captionStyle,
  edit,
  setError,
  uploadedList,
  setUploadedList
}: AttachmentCardProps) => {
  const computedCaptionStyle = captionStyle ?? {
    maxWidth: edit ? "201px" : "176px"
  }
  const { iconSize, iconImage } = utils.getAttachmentIconDetails(
    attachment,
    true
  )

  const image = (
    <img
      className="image-preview info-show card-image"
      src={iconImage}
      alt={attachment.caption}
      width={iconSize}
      height={iconSize}
      style={{ objectFit: "contain" }}
    />
  )
  const divContents = onClick ? (
    <>{image}</>
  ) : (
    <LinkTo
      className="detail-btn"
      modelType="Attachment"
      model={attachment}
      showIcon={false}
    >
      {image}
    </LinkTo>
  )
  return (
    <div className="attachment-card" key={attachment.uuid}>
      <Card>
        <div style={{ display: "grid" }} onClick={() => onClick?.(attachment)}>
          {divContents}
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

export default AttachmentCard
