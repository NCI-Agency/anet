import Messages from "components/Messages"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import "./Attachment.css"
import AttachmentCard from "./AttachmentCard"

const ShowUploadedAttachments = ({ attachmentList }) => {
  const [uploadedList, setUploadedList] = useState([])
  const [error, setError] = useState(null)
  const [remove, setRemove] = useState(false)

  useEffect(() => {
    if (attachmentList.length > 0) {
      setUploadedList(attachmentList)
    }
    if (remove) {
      setUploadedList(uploadedList)
    }
  }, [attachmentList, uploadedList, remove])

  return (
    <>
      <Messages error={error} />
      {uploadedList?.map((attachment, index) => (
        <AttachmentCard
          attachment={attachment}
          key={index}
          remove={remove}
          setError={setError}
          setRemove={setRemove}
          uploadedList={uploadedList}
          setUploadedList={setUploadedList}
        />
      ))}
    </>
  )
}

ShowUploadedAttachments.propTypes = {
  attachmentList: PropTypes.array
}

export default ShowUploadedAttachments
