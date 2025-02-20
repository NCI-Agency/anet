import AppContext from "components/AppContext"
import UploadAttachment from "components/Attachment/UploadAttachment"
import React, { useContext, useState } from "react"
import { Button } from "react-bootstrap"
import Settings from "settings"
import AttachmentCard from "./AttachmentCard"

interface AttachmentsListProps {
  attachments: any[]
}

const AttachmentsList = ({ attachments }: AttachmentsListProps) => {
  if (attachments.length === 0) {
    return <em>No attachments found</em>
  }
  return (
    <div className="attachment-card-list">
      {attachments.map(attachment => (
        <AttachmentCard key={attachment.uuid} attachment={attachment} />
      ))}
    </div>
  )
}

interface AttachmentsDetailViewProps {
  attachments: any[]
  updateAttachments: (attachments: any[]) => void
  relatedObjectType: string
  relatedObjectUuid: string
  allowEdit?: boolean
}

const AttachmentsDetailView = ({
  attachments,
  updateAttachments,
  relatedObjectType,
  relatedObjectUuid,
  allowEdit
}: AttachmentsDetailViewProps) => {
  const { currentUser } = useContext(AppContext)
  const [editAttachments, setEditAttachments] = useState(false)
  const canEditAttachments =
    !Settings.fields.attachment.featureDisabled &&
    (!Settings.fields.attachment.restrictToAdmins || currentUser?.isAdmin()) &&
    allowEdit

  if (!canEditAttachments) {
    return <AttachmentsList attachments={attachments} />
  }

  return (
    <>
      {editAttachments ? (
        <UploadAttachment
          attachments={attachments}
          updateAttachments={updateAttachments}
          relatedObjectType={relatedObjectType}
          relatedObjectUuid={relatedObjectUuid}
        />
      ) : (
        <AttachmentsList attachments={attachments} />
      )}
      <div className="clearfix">
        <Button
          variant="primary"
          onClick={() => setEditAttachments(!editAttachments)}
          id="edit-attachments"
        >
          {editAttachments ? "View" : "Edit"} attachments
        </Button>
      </div>
    </>
  )
}

export default AttachmentsDetailView
