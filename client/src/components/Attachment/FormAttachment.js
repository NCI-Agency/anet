import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import Messages from "components/Messages"
import ConfirmDestructive from "components/ConfirmDestructive"
import upload from "../../resources/download.png"
import "./Attachment.css"

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

const GQL_DELETE_ATTACHMENT = gql`
  mutation ($uuid: String!) {
    deleteAttachment(uuid: $uuid)
  }
`

const FormAttachment = ({
  attachmentFunc,
  type,
  setIsAttachment,
  setLoadingError,
  loadingError
}) => {
  const [attachmentList, setAttachmentList] = useState([])
  const [error, setError] = useState(null)
  const base64Marker = ";base64,"
  // const imageMimeType = /image\/(png|jpg|jpeg)/i;

  useEffect(() => {
    attachmentFunc.current = onSubmit
  })

  useEffect(() => {
    if (attachmentList.length > 0) {
      setIsAttachment(true)
    } else {
      setIsAttachment(false)
    }
  })

  const handleUploadFile = file => {
    toast.success(
      `Your ${file.fileName} has been uploaded`
    )
    setAttachmentList(current => [...current, file])
  }

  const handleFileEvent = async e => {
    const file = e.target.files[0]
    // check file name, if exist do not add again
    if (attachmentList.find(a => a.fileName === file.name)) {
      return
    }
    const base64 = await convertBase64(file)
    const attachment = new Attachment()
    attachment.fileName = file.name
    attachment.mimeType = base64.split(":").pop().split(";")[0]
    attachment.content = base64
    attachment.attachmentRelatedObjects.relatedObjectType = type
    attachment.attachmentRelatedObjects.relatedObjectUuid = null
    attachment.classification = "NATO_UNCLASSIFIED"
    save(attachment)
      .then((response) => {
        if (response) {
          attachment.uuid = response.createAttachment
          handleUploadFile(attachment)
        }
      })
  }

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

  const returnFileSize = number => {
    if (number < 1024) {
      return `${number} bytes`
    } else if (number >= 1024 && number < 1048576) {
      return `${(number / 1024).toFixed(1)} KB`
    } else if (number >= 1048576) {
      return `${(number / 1048576).toFixed(1)} MB`
    }
  }

  const deleteFile = index => {
    setAttachmentList(oldFiles => {
      return oldFiles.filter((_, i) => i !== index)
    })
  }

  return (
    <>
      <Messages error={error} />
      {/** Select and drop file in here **/}
      <section className="FileUploadContainer">
        <div>
          <p className="DragDropText">
            <img src={upload} alt="uploadIcon" className="uploadIcon" />
            <span>
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

      {/** Show uploaded files in here **/}
      <div
        className="FilePreviewContainer"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: attachmentList.length >= 5 ? "space-between" : ""
        }}
      >
        {attachmentList.length > 0 ? (
          <>
            {attachmentList.map((file, index) => (
              <div
                style={{
                  width: "18%",
                  marginRight: attachmentList.length < 5 ? "10px" : ""
                }}
                key={file?.uuid}
              >
                <div className="previewCard">
                  {file?.mimeType?.substring(
                    0,
                    file?.mimeType?.indexOf("/")
                  ) === "image" ? (
                    <div className="imageCardWrap">
                      <div
                        className="imagePreview info-show"
                        style={{
                          width: "100%",
                          height: "120px",
                          borderRadius: "6px",
                          backgroundSize: "cover",
                          backgroundImage: `url(${file?.content})`
                        }}
                      >
                        <div className="file-info image-info">
                          <div>
                            <span>
                              {file?.fileName}
                            </span>
                          </div>
                          <div className="info-line">
                            <span>{returnFileSize(file?.content?.length)}</span>
                            <ConfirmDestructive
                              onConfirm={() => deleteAttachment(file.uuid)}
                              objectType="attachment"
                              objectDisplay={"#" + file.uuid}
                              title="Delete attachment"
                              variant="outline-danger"
                              buttonSize="xs"
                            >
                              <Icon icon={IconNames.TRASH} />
                            </ConfirmDestructive>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                      <div
                        className="otherPreview info-show"
                        style={{
                          height: "120px",
                          borderRadius: "6px",
                          background: "#c1c1c1"
                        }}
                      >
                        <div className="file-info">
                          <div>
                            {file?.fileName?.substring(
                              0,
                              file?.fileName?.indexOf(".")
                            ).length > 10 ? (
                              <span>
                                {file?.fileName?.substring(0, 10)}...
                                {file?.fileName?.split(".").pop()}
                              </span>
                              ) : (
                                <span>{file?.fileName}</span>
                              )}
                          </div>
                          <div className="info-line">
                            <span>{returnFileSize(file?.content?.length)}</span>
                            <Icon
                              className="icon delete"
                              icon={IconNames.TRASH}
                              onClick={() => deleteFile(index)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <></>
        )}
      </div>
      {loadingError && <p style={{ color: "red" }}>An error occurred while uploading Attachments.</p>}
    </>
  )

  function onSubmit(relatedObjectUuid) {
    const attachmentSaved = attachmentList.filter(attach => attach.uuid !== null)
    for (let i = 0; i < attachmentSaved.length; i++) {
      save(attachmentSaved[i], relatedObjectUuid, true)
        .then(response => {
          attachmentSaved[i].uuid = response.createAttachment
        })
        .catch(error => {
          setLoadingError(true)
          console.error("error :", error)
        })
    }
  }

  function save(value, relatedObjectUuid, edit) {
    const attachment = Attachment.filterClientSideFields(value)
    const base64Index = value.content.indexOf(base64Marker) + base64Marker.length
    attachment.content = value.content.substring(base64Index)
    const operation = edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT
    attachment.attachmentRelatedObjects.relatedObjectUuid = relatedObjectUuid
    return API.mutation(operation, { attachment })
  }

  function deleteAttachment(uuid) {
    const newAttachments = attachmentList.filter(item => item.uuid !== uuid) // remove note
    API.mutation(GQL_DELETE_ATTACHMENT, { uuid })
      .then(data => {
        setError(null)
        setAttachmentList(newAttachments) // remove note
        toast.error(
          "Your attachment has been successfully deleted"
        )
      })
      .catch(error => {
        setError(error)
      })
  }
}

FormAttachment.propTypes = {
  attachmentFunc: PropTypes.object,
  type: PropTypes.string,
  loadingError: PropTypes.bool,
  setIsAttachment: PropTypes.func,
  setLoadingError: PropTypes.func
}

export default FormAttachment
