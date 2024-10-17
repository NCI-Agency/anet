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
import utils from "utils"
import { RELATED_OBJECT_TYPE_TO_ENTITY_TYPE } from "utils_links"
import "./Attachment.css"
import AttachmentCard from "./AttachmentCard"

const GQL_CREATE_ATTACHMENT = gql`
  mutation ($attachment: AttachmentInput!) {
    createAttachment(attachment: $attachment)
  }
`

export const attachmentSave = async(
  fileName,
  mimeType,
  contentLength,
  caption,
  file,
  relatedObjectType,
  relatedObjectUuid
) => {
  const attachment = Attachment.filterClientSideFields(
    new Attachment({
      fileName,
      mimeType,
      caption,
      contentLength,
      attachmentRelatedObjects: [
        {
          relatedObjectType,
          relatedObjectUuid
        }
      ]
    })
  )
  return API.mutation(GQL_CREATE_ATTACHMENT, { attachment })
    .then(response => {
      attachment.uuid = response.createAttachment
      const [authHeaderName, authHeaderValue] = API._getAuthHeader()
      const toastId = `uploadProgress.${attachment.uuid}`
      toast.info(`Upload of ${attachment.fileName} in progress`, {
        toastId,
        autoClose: false,
        closeOnClick: false,
        pauseOnHover: false
      })
      return axios
        .postForm(
          `/api/attachment/uploadAttachmentContent/${attachment.uuid}`,
          { file },
          {
            headers: { [authHeaderName]: authHeaderValue },
            onUploadProgress: progressEvent => {
              if (progressEvent.progress === 1) {
                toast.update(toastId, {
                  render: `Processing uploaded attachment ${attachment.fileName}`
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
          toast.success(
            `Your attachment ${attachment.fileName} has been uploaded`
          )
          return attachment
        })
        .catch(error => {
          toast.dismiss(toastId)
          attachment.contentLength = -1
          toast.error(
            `Attachment content upload failed for ${attachment.fileName}: ${
              error.response?.data?.error || error.message
            }`
          )
          return attachment
        })
    })
    .catch(error => {
      toast.error(
        `Attachment upload for ${attachment.fileName} failed: ${error.message}`
      )
      return undefined
    })
}

const UploadAttachment = ({
  attachments,
  updateAttachments,
  relatedObjectType,
  relatedObjectUuid,
  saveRelatedObject
}) => {
  const [error, setError] = useState(null)
  const [objectUuid, setObjectUuid] = useState(relatedObjectUuid)
  const mimeTypes = Settings.fields.attachment.fileTypes?.map(
    fileType => fileType.mimeType
  )

  const handleFileEvent = async e => {
    // Must keep a copy of this state here, as it is not updated while this function runs
    let currentAttachments = [...attachments]
    let currentObjectUuid = objectUuid
    for (const file of e.target?.files || []) {
      if (!file) {
        // No file was selected, just continue
        continue
      }
      if (!mimeTypes?.includes(file.type)) {
        toast.error(
          `Attaching "${file.name}" failed; files of type "${file.type}" are not allowed`
        )
        continue
      }
      const caption = utils.stripExtension(file.name)
      if (currentObjectUuid) {
        const newAttachment = await attachmentSave(
          file.name,
          file.type,
          file.size,
          caption,
          file,
          relatedObjectType,
          currentObjectUuid
        )
        if (newAttachment) {
          currentAttachments = [...currentAttachments, newAttachment]
          updateAttachments(currentAttachments)
        }
      } else {
        // Save the related object first
        await saveRelatedObject()
          .then(async response => {
            currentObjectUuid = response.uuid
            setObjectUuid(currentObjectUuid)
            const newAttachment = await attachmentSave(
              file.name,
              file.type,
              file.size,
              caption,
              file,
              relatedObjectType,
              currentObjectUuid
            )
            if (newAttachment) {
              currentAttachments = [...currentAttachments, newAttachment]
              updateAttachments(currentAttachments)
            }
          })
          .catch(() =>
            toast.error(
              `Attaching "${file.name}" failed; there was an error saving the ${RELATED_OBJECT_TYPE_TO_ENTITY_TYPE[relatedObjectType]}`
            )
          )
      }
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
          multiple
          accept={mimeTypes}
          onChange={handleFileEvent}
        />
      </section>

      {/** **** Show uploaded files in here **** **/}
      <div className="attachment-card-list">
        {attachments.map(attachment => (
          <AttachmentCard
            key={attachment.uuid}
            attachment={attachment}
            edit
            setError={setError}
            uploadedList={attachments}
            setUploadedList={updateAttachments}
          />
        ))}
      </div>
    </div>
  )
}

UploadAttachment.propTypes = {
  attachments: PropTypes.array,
  updateAttachments: PropTypes.func,
  relatedObjectType: PropTypes.string.isRequired,
  relatedObjectUuid: PropTypes.string,
  saveRelatedObject: PropTypes.func
}

UploadAttachment.defaultProps = {
  attachments: [],
  updateAttachments: () => {}
}

export default UploadAttachment
