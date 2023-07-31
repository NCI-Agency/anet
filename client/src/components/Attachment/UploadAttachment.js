import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import axios from "axios"
import Messages from "components/Messages"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import Settings from "settings"
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
  removeable,
  relatedObjectType,
  relatedObjectUuid,
  saveRelatedObject
}) => {
  const [error, setError] = useState(null)
  const [erase, setErase] = useState(false)
  const [uploadedList, setUploadedList] = useState([])

  useEffect(() => {
    // In the edit mode the base page entity (report, location, etc.) always has an uuid
    // So when uploading new attachment it is always inserted related tables, (ie. see attachmentSave)
    if (edit) {
      return
    }
    // if base entity is not created, the attachment can not be associated
    if (!relatedObjectUuid) {
      return
    }
    // Update only object not associated with the base entity, as in report
    const updateList = uploadedList.filter(
      list => !list.attachmentRelatedObjects[0].relatedObjectUuid
    )
    for (let i = 0; i < updateList.length; i++) {
      save(updateList[i], relatedObjectUuid, true)
    }
  }, [edit, relatedObjectUuid, uploadedList])

  const attachmentSave = async(e, uuid) => {
    const file = e.target?.files?.[0]
    if (!file) {
      // No file was selected, just return
      return
    }
    const selectedAttachment = new Attachment({
      fileName: file.name,
      mimeType: file.type,
      contentLength: file.size,
      attachmentRelatedObjects: [
        {
          relatedObjectType,
          relatedObjectUuid: uuid
        }
      ]
    })
    return save(selectedAttachment, uuid, false)
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
    if (relatedObjectUuid) {
      await attachmentSave(e, relatedObjectUuid)
    } else if (!saveRelatedObject) {
      // No related object UUID provided, saving attachment without related object...
      await attachmentSave(e)
    } else {
      // Save the related object first, then attach the file
      saveRelatedObject()
        .then(async response => {
          await attachmentSave(e, response.uuid)
        })
        .catch(() => {
          const errorMessage = `Failed to attach the file; there was an error saving the ${RELATED_OBJECT_TYPE_TO_ENTITY_TYPE[relatedObjectType]}`
          toast.error(errorMessage)
        })
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
            erase={erase}
            removeable={removeable && edit}
            setError={setError}
            setErase={setErase}
            uploadedList={uploadedList}
            setUploadedList={setUploadedList}
          />
        ))}
        {/** When on an edit page, show uploaded attachments **/}
        {edit && (
          <UploadedAttachments
            removeable={removeable && edit}
            uuid={relatedObjectUuid}
          />
        )}
      </div>
    </div>
  )

  function save(values, relatedObjectUuid, edit) {
    const attachment = Attachment.filterClientSideFields(values)
    const operation = edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT
    attachment.attachmentRelatedObjects[0].relatedObjectUuid = relatedObjectUuid
    return API.mutation(operation, { attachment })
  }
}

UploadAttachment.propTypes = {
  edit: PropTypes.bool,
  removeable: PropTypes.bool,
  relatedObjectType: PropTypes.string.isRequired,
  relatedObjectUuid: PropTypes.string,
  saveRelatedObject: PropTypes.func
}

export default UploadAttachment
