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
    return null
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
  allowEdit = false
}: AttachmentsDetailViewProps) => {
  const [editAttachments, setEditAttachments] = useState(false)

  const { currentUser } = useContext(AppContext)
  const isAdmin = currentUser && currentUser.isAdmin()
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const attachmentEditEnabled =
    attachmentsEnabled &&
    (!Settings.fields.attachment.restrictToAdmins || isAdmin)
  const canEditAttachments = attachmentEditEnabled && allowEdit

  if (!canEditAttachments) {
    return <AttachmentsList attachments={attachments} />
  }

  const renderButton = () => {
    return (
      <Button
        variant="primary"
        onClick={() => setEditAttachments(!editAttachments)}
        id="edit-attachments"
      >
        {editAttachments ? "View" : "Edit"} attachments
      </Button>
    )
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
      {renderButton()}
    </>
  )
}

export default AttachmentsDetailView
