import AttachmentCard from "./AttachmentCard"

interface AttachmentsDetailViewProps {
  attachments?: any
  allowEdit?: boolean
}

const AttachmentsDetailView = ({
  attachments,
  allowEdit
}: AttachmentsDetailViewProps) => {
  if (attachments.length === 0) {
    return null
  }
  return (
    <div className="attachment-card-list">
      {attachments.map(attachment => (
        <AttachmentCard
          key={attachment.uuid}
          attachment={attachment}
        />
      ))}
    </div>
  )
}

export default AttachmentsDetailView
