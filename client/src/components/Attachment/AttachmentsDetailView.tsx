import UploadAttachment from "components/Attachment/UploadAttachment"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import AttachmentCard from "./AttachmentCard"

interface AttachmentsListProps {
  attachments: any
}

const AttachmentsList = ({ attachments }: AttachmentsListProps) => {
  if (attachments.length === 0) {
    return null
  }
  return (
    <div className="attachment-card-list" style={{ gap: "10px" }}>
      {attachments.map(attachment => (
        <AttachmentCard key={attachment.uuid} attachment={attachment} />
      ))}
    </div>
  )
}

interface AttachmentsDetailViewProps {
  attachments: any
  updateAttachments: any
  relatedObjectType: any
  relatedObjectUuid: any
  allowEdit?: boolean
}

const AttachmentsDetailView = ({
  attachments,
  updateAttachments,
  relatedObjectType,
  relatedObjectUuid,
  allowEdit = false
}: AttachmentsDetailViewProps) => {
  const [editAttachments, setEditAttachments] = useState(false)

  return allowEdit ? (
    editAttachments ? (
      <UploadAttachment
        attachments={attachments}
        updateAttachments={updateAttachments}
        relatedObjectType={relatedObjectType}
        relatedObjectUuid={relatedObjectUuid}
      />
    ) : (
      <>
        <AttachmentsList attachments={attachments} />
        <Button variant="primary" onClick={() => setEditAttachments(true)}>
          Edit attachments
        </Button>
      </>
    )
  ) : (
    <AttachmentsList attachments={attachments} />
  )
}

export default AttachmentsDetailView
