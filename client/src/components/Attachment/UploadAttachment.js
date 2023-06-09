import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import axios from "axios"
import Messages from "components/Messages"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { toast } from "react-toastify"
import Settings from "settings"
import "./Attachment.css"
import AttachmentCard from "./AttachmentCard"
import UploadedAttachments from "./UploadedAttachments"

const GQL_CREATE_ATTACHMENT = gql`
  mutation ($attachment: AttachmentInput!) {
    createAttachment(attachment: $attachment)
  }
`

const GQL_UPDATE_ATTACHMENT = gql`
  mutation ($attachment: AttachmentInput!) {
    updateAttachment(attachment: $attachment)
  }
`

const UploadAttachment = ({ getRelatedObject, edit, saveRelatedObject }) => {
  const [error, setError] = useState(null)
  const [remove, setRemove] = useState(false)
  const [uploadedList, setUploadedList] = useState([])
  const relatedObject = getRelatedObject()

  const attachmentSave = async e => {
    const file = e.target.files[0]
    const selectedAttachment = new Attachment({
      fileName: file.name,
      mimeType: file.type,
      contentLength: file.size,
      attachmentRelatedObjects: [
        {
          relatedObjectType: relatedObject.type,
          relatedObjectUuid: relatedObject.uuid
        }
      ]
    })
    return save(selectedAttachment, relatedObject.uuid, false)
      .then(response => {
        selectedAttachment.uuid = response.createAttachment
        const [authHeaderName, authHeaderValue] = API._getAuthHeader()
        const toastId = `uploadProgress.${selectedAttachment.uuid}`
        toast.info(`Upload of ${selectedAttachment.fileName} in progress`, {
          toastId,
          autoClose: false,
          closeOnClick: false,
          pauseOnHover: false
        })
        return axios
          .postForm(
            `/api/attachment/uploadAttachmentContent/${selectedAttachment.uuid}`,
            { file },
            {
              headers: { [authHeaderName]: authHeaderValue },
              onUploadProgress: progressEvent => {
                if (progressEvent.progress === 1) {
                  toast.update(toastId, {
                    render: `Processing uploaded attachment ${selectedAttachment.fileName}`
                  })
                } else {
                  toast.update(toastId, {
                    progress: progressEvent.progress
                  })
                }
              }
            }
          )
          .then(() => {
            toast.done(toastId)
            setUploadedList(current => [...current, selectedAttachment])
            toast.success(
              `Your attachment ${selectedAttachment.fileName} has been uploaded`
            )
          })
          .catch(error => {
            toast.dismiss(toastId)
            selectedAttachment.contentLength = -1
            setUploadedList(current => [...current, selectedAttachment])
            toast.error(
              `Attachment content upload failed for ${
                selectedAttachment.fileName
              }: ${error.response?.data?.error || error.message}`
            )
          })
      })
      .catch(error =>
        toast.error(
          `Attachment upload for ${selectedAttachment.fileName} failed: ${error.message}`
        )
      )
  }

  const handleFileEvent = async e => {
    // Control related object has an uuid or not
    if (!relatedObject.uuid && relatedObject.type === "reports") {
      saveRelatedObject().then(async response => {
        relatedObject.uuid = response
        await attachmentSave(e)
      })
    } else if (!relatedObject.uuid && relatedObject.type !== "reports") {
      relatedObject.uuid = saveRelatedObject()
      console.log(relatedObject)
      edit = true
      await attachmentSave(e)
    } else {
      await attachmentSave(e)
    }
  }

  return (
    <div>
      <Messages error={error} />
      {/** **** Select and drop file in here **** **/}
      <section className="file-upload-container">
        <div>
          <p className="drag-drop-text">
            <Icon className="icon" size={30} icon={IconNames.EXPORT} />
            <span style={{ marginTop: "5px" }}>
              <b>Choose a file</b> or Drag it here
            </span>
          </p>
        </div>
        <input
          className="form-field"
          id="fileUpload"
          type="file"
          accept={Settings.fields.attachment.mimeTypes}
          onChange={handleFileEvent}
        />
      </section>

      {/** **** Show uploaded files in here **** **/}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {uploadedList.map((attachment, index) => (
          <AttachmentCard
            key={index}
            attachment={attachment}
            index={index}
            remove={remove}
            setError={setError}
            setRemove={setRemove}
            uploadedList={uploadedList}
            setUploadedList={setUploadedList}
          />
        ))}
        {/** When on an edit page, show uploaded attachments **/}
        {edit && <UploadedAttachments uuid={relatedObject.uuid} />}
      </div>
    </div>
  )

  function save(values, relatedObjectUuid, edit) {
    const attachment = Attachment.filterClientSideFields(values)
    const operation = edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT
    return API.mutation(operation, { attachment })
  }
}

UploadAttachment.propTypes = {
  edit: PropTypes.bool,
  getRelatedObject: PropTypes.func.isRequired,
  saveRelatedObject: PropTypes.func.isRequired
}

export default UploadAttachment
