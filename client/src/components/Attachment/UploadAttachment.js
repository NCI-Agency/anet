import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import Messages from "components/Messages"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
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

const UploadAttachment = ({
  edit,
  type,
  attachmentFunc,
  setIsAttachment,
  setLoadingError,
  relatedObjectUuid
}) => {
  const base64Marker = ";base64,"
  const [error, setError] = useState(null)
  const [remove, setRemove] = useState(false)
  const [uploadedList, setUploadedList] = useState([])

  // Trigger attachment submit from report save
  useEffect(() => {
    attachmentFunc.current = onSubmit
  })

  const handleUploadFile = file => {
    setIsAttachment(true)
    setUploadedList(current => [...current, file])
    toast.success("Your document has been uploaded")
  }

  const handleFileEvent = async e => {
    const file = e.target.files[0]
    const selectedAttachment = new Attachment()
    const base64 = await convertBase64(file)

    // Set initial values for new attachment
    selectedAttachment.content = base64
    selectedAttachment.fileName = file.name
    selectedAttachment.mimeType = base64.split(":").pop().split(";")[0]
    selectedAttachment.attachmentRelatedObjects[0].relatedObjectType = type
    selectedAttachment.attachmentRelatedObjects[0].relatedObjectUuid = null
    selectedAttachment.classification =
      Settings.fields.attachment.classification.choices.UNDEFINED.value

    save(selectedAttachment).then(response => {
      selectedAttachment.uuid = response.createAttachment
      selectedAttachment.contentLength = file.size
      handleUploadFile(selectedAttachment)
    })
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
      {error && <Messages error={error} />}
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
        {uploadedList.map((file, index) => (
          <AttachmentCard
            key={index}
            file={file}
            index={index}
            remove={remove}
            setError={setError}
            setRemove={setRemove}
            uploadedList={uploadedList}
            setUploadedList={setUploadedList}
          />
        ))}
        {/** For edit report edit page show uploaded attachments **/}
        {edit && <UploadedAttachments uuid={relatedObjectUuid} />}
      </div>
    </div>
  )

  function onSubmit(relatedObjectUuid) {
    const unsavedAttachment = uploadedList.filter(
      attach =>
        !attach.attachmentRelatedObjects[0].relatedObjectUuid &&
        attach.uuid !== null
    )
    if (unsavedAttachment.length > 0) {
      for (let i = 0; i < unsavedAttachment.length; i++) {
        save(unsavedAttachment[i], relatedObjectUuid, true).catch(() => {
          setLoadingError(true)
        })
      }
    }
  }

  function save(value, relatedObjectUuid, edit) {
    const attachment = Attachment.filterClientSideFields(value)
    const base64Index =
      value.content?.indexOf(base64Marker) + base64Marker.length

    attachment.content = value.content?.substring(base64Index)
    attachment.attachmentRelatedObjects[0].relatedObjectUuid = relatedObjectUuid

    const operation = edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT
    return API.mutation(operation, { attachment })
  }
}

UploadAttachment.propTypes = {
  edit: PropTypes.bool,
  type: PropTypes.string,
  setIsAttachment: PropTypes.func,
  setLoadingError: PropTypes.func,
  attachmentFunc: PropTypes.object,
  relatedObjectUuid: PropTypes.string
}

export default UploadAttachment
