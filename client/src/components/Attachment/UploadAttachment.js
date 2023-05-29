import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import Messages from "components/Messages"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { toast } from "react-toastify"
import Settings from "settings"
import "./Attachment.css"
import axios from "axios"
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

const UploadAttachment = ({ getRelatedObject, edit, saveAttachment }) => {
  const [error, setError] = useState(null)
  const [remove, setRemove] = useState(false)
  const [uploadedList, setUploadedList] = useState([])
  const relatedObject = getRelatedObject()

  const handleUploadFile = file => {
    setUploadedList(current => [...current, file])
    toast.success("Your document has been uploaded")
  }

  const AttachmentSave = async e => {
    const file = e.target.files[0]
    const base64 = await convertBase64(file)
    const base64Marker = ";base64,"
    const base64Index = base64.indexOf(base64Marker) + base64Marker.length

    const selectedAttachment = new Attachment({
      content: base64.substring(base64Index),
      fileName: file.name,
      mimeType: file.type,
      attachmentRelatedObjects: [
        { relatedObjectType: relatedObject.type, relatedObjectUuid: relatedObject.uuid }
      ],
      classification:
        Settings.fields.attachment.classification.choices.UNDEFINED.value
    })

    save(selectedAttachment, relatedObject.uuid, false)
      .then(response => {
        selectedAttachment.uuid = response.createAttachment
        selectedAttachment.contentLength = file.size
        try {
          const formData = new FormData()
          formData.append("file", file)
          axios
            .post(`/api/attachment/uploadAttachmentContent/${selectedAttachment.uuid}`, formData)
          handleUploadFile(selectedAttachment)
        } catch (error) {
          toast.error("Attachment upload failed.")
        }
      })
  }

  const handleFileEvent = e => {
    // Control related object has an uuid or not
    if (!relatedObject.uuid) {
      saveAttachment().then(response => {
        relatedObject.uuid = response
        AttachmentSave(e)
      })
    } else {
      AttachmentSave(e)
    }
  }

  // Convert file to base64 string
  const convertBase64 = file => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)

      fileReader.onload = () => {
        resolve(fileReader.result)
      }

      fileReader.onerror = error => {
        reject(error)
      }
    })
  }

  return (
    <div>
      <Messages error={error} />
      {/** **** Select and drop file in here **** **/}
      <section className="FileUploadContainer">
        <div>
          <p className="DragDropText">
            <Icon className="uploadIcon" size={30} icon={IconNames.EXPORT} />
            <span style={{ marginTop: "5px" }}>
              <b>Choose a file</b> or Drag it here
            </span>
          </p>
        </div>
        <input
          className="FormField"
          id="fileUpload"
          type="file"
          accept="image/*, .pdf"
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
        {/** For edit report edit page show uploaded attachments **/}
        {edit && <UploadedAttachments uuid={relatedObject.uuid} />}
      </div>
    </div>
  )

  function save(values, relatedObjectUuid, edit) {
    const attachment = Attachment.filterClientSideFields(
      values,
      edit && "content"
    )
    const operation = edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT
    return API.mutation(operation, { attachment })
  }
}

UploadAttachment.propTypes = {
  edit: PropTypes.bool,
  getRelatedObject: PropTypes.func,
  saveAttachment: PropTypes.func
}

export default UploadAttachment
