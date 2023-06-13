import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import axios from "axios"
import Messages from "components/Messages"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"
import { toast } from "react-toastify"
import Settings from "settings"
import utils from "utils"
import { RELATED_OBJECT_TYPE_TO_ENTITY_TYPE } from "utils_links"
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

const UploadAttachment = ({
  edit,
  relatedObjectType,
  relatedObjectUuid,
  saveRelatedObject
}) => {
  const [error, setError] = useState(null)
  const [remove, setRemove] = useState(false)
  const [uploadedList, setUploadedList] = useState([])

  const attachmentSave = async(e, uuid) => {
    const file = e.target?.files?.[0]
    if (!file) {
      // No file was selected, just return
      return
    }
    const selectedAttachment = new Attachment({
      fileName: file.name,
      mimeType: file.type,
      caption: utils.stripExtension(file.name),
      contentLength: file.size,
      attachmentRelatedObjects: [
        {
          relatedObjectType,
          relatedObjectUuid: uuid
        }
      ]
    })
    return save(selectedAttachment, false)
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
              }: ${error.response?.data?.error || error.message}`,
              {
                autoClose: false,
                closeOnClick: true
              }
            )
          })
      })
      .catch(error =>
        toast.error(
          `Attachment upload for ${selectedAttachment.fileName} failed: ${error.message}`,
          {
            autoClose: false,
            closeOnClick: true
          }
        )
      )
  }

  const handleFileEvent = async e => {
    if (relatedObjectUuid) {
      await attachmentSave(e, relatedObjectUuid)
    } else {
      // Save the related object first
      saveRelatedObject()
        .then(async response => await attachmentSave(e, response.uuid))
        .catch(() =>
          toast.error(
            `Attaching the file failed; there was an error saving the ${RELATED_OBJECT_TYPE_TO_ENTITY_TYPE[relatedObjectType]}`
          )
        )
    }
    await attachmentSave(e)
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
        {edit && <UploadedAttachments uuid={relatedObjectUuid} />}
      </div>
    </div>
  )

  function save(values, edit) {
    const attachment = Attachment.filterClientSideFields(values)
    const operation = edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT
    attachment.attachmentRelatedObjects[0].relatedObjectUuid = relatedObjectUuid
    return API.mutation(operation, { attachment })
  }
}

UploadAttachment.propTypes = {
  edit: PropTypes.bool,
  relatedObjectType: PropTypes.string.isRequired,
  relatedObjectUuid: PropTypes.string,
  saveRelatedObject: PropTypes.func.isRequired
}

export default UploadAttachment
