import Messages from "components/Messages"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import "./Attachment.css"
import AttachmentCard from "./AttachmentCard"

const ShowUploadedAttachments = ({ attachmentList, removeable }) => {
  const [uploadedList, setUploadedList] = useState([])
  const [error, setError] = useState(null)
  const [erase, setErase] = useState(false)

  useEffect(() => {
    if (attachmentList.length > 0) {
      setUploadedList(attachmentList)
    }
    if (erase) {
      setUploadedList(uploadedList)
    }
  }, [attachmentList, uploadedList, erase])

  return (
    <>
      <Messages error={error} />
      {uploadedList?.map((attachment, index) => (
        <AttachmentCard
          attachment={attachment}
          key={index}
          erase={erase}
          removeable={removeable}
          setError={setError}
          setErase={setErase}
          uploadedList={uploadedList}
          setUploadedList={setUploadedList}
        />
      ))}
    </>
  )
}

ShowUploadedAttachments.propTypes = {
  attachmentList: PropTypes.array,
  removeable: PropTypes.bool
}

export default ShowUploadedAttachments
