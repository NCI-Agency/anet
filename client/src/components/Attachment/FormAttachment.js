import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React, { useEffect, useState } from "react"
import { Button, Card } from "react-bootstrap"
import { toast } from "react-toastify"
import Settings from "settings"
import upload from "../../resources/download.png"
import "./Attachment.css"
import AttachmentEditModal from "./AttachmentEditModal"

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
  const [showEditModal, setShowEditModal] = useState(null)
  const base64Marker = ";base64,"

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
    toast.success(`Your ${file.fileName} has been uploaded`)
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
    attachment.classification = Settings.fields.report.attachments.classification[0]
    save(attachment).then(response => {
      attachment.uuid = response.createAttachment
      handleUploadFile(attachment)
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
                <Card>
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
                      <div style={{ display: "grid" }}>
                        <LinkTo
                          className="detail-btn"
                          modelType="Attachment"
                          edit
                          model={file}
                        >
                          Go Edit
                        </LinkTo>
                      </div>
                    </div>
                  </div>
                  <Card.Body className="p-1">
                    <Card.Title style={{ fontSize: "15px" }} className="info-line">
                      {file?.fileName?.substring(0, 8)}...
                      <span>{returnFileSize(file?.content?.length)}</span>
                    </Card.Title>
                    <div className="info-line">
                      <div>
                        <Button
                          variant="outline-primary"
                          onClick={() => showEditAttachmentModal(file.uuid)}
                        >
                          <Icon
                            icon={IconNames.EDIT}
                            className="icon edit"
                          />
                        </Button>
                        <AttachmentEditModal
                          attachment={file}
                          index={index}
                          setAttachmentList={setAttachmentList}
                          attachmentList={attachmentList}
                          showModal={showEditModal === file.uuid}
                          onCancel={cancelEditAttachmentModal}
                          onSuccess={hideEditAttachmentModal}
                        />
                      </div>
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
                  </Card.Body>
                </Card>
                {/* <div className="previewCard">
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
                          <div className="info-line top">
                            <span>{file?.fileName?.substring(0, 10)}...</span>
                            <Icon
                              icon={IconNames.EDIT}
                              className="icon edit"
                              onClick={() => showEditAttachmentModal(file.uuid)}
                            />
                            <AttachmentEditModal
                              attachment={file}
                              index={index}
                              setAttachmentList={setAttachmentList}
                              attachmentList={attachmentList}
                              showModal={showEditModal === file.uuid}
                              onCancel={cancelEditAttachmentModal}
                              onSuccess={hideEditAttachmentModal}
                            />
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <LinkTo
                              className="detail-btn"
                              modelType="Attachment"
                              edit
                              model={file}
                            >
                              Go Details
                            </LinkTo>
                          </div>
                          <div className="info-line bottom">
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
                          <div className="info-line">
                            <span>
                              {file?.fileName?.substring(0, 10)}...
                              {file?.fileName?.split(".").pop()}
                            </span>
                            <Icon
                              icon={IconNames.EDIT}
                              className="icon edit"
                              onClick={() => showEditAttachmentModal(file.uuid)}
                            />
                            <AttachmentEditModal
                              attachment={file}
                              showModal={showEditModal === file.uuid}
                              onCancel={cancelEditAttachmentModal}
                              onSuccess={hideEditAttachmentModal}
                            />
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
                    )}
                </div> */}
              </div>
            ))}
          </>
        ) : (
          <></>
        )}
      </div>
      {loadingError && (
        <p style={{ color: "red" }}>
          An error occurred while uploading Attachments.
        </p>
      )}
    </>
  )

  function onSubmit(relatedObjectUuid) {
    const attachmentSaved = attachmentList.filter(
      attach =>
        !attach.attachmentRelatedObjects.relatedObjectUuid &&
        attach.uuid !== null
    )
    if (attachmentSaved.length > 0) {
      for (let i = 0; i < attachmentSaved.length; i++) {
        save(attachmentSaved[i], relatedObjectUuid, true)
          .then(response => {
            console.log(response)
          })
          .catch(error => {
            setLoadingError(true)
            console.error("error :", error)
          })
      }
    }
  }

  function save(value, relatedObjectUuid, edit) {
    const operation = edit ? GQL_UPDATE_ATTACHMENT : GQL_CREATE_ATTACHMENT
    const base64Index =
      value.content.indexOf(base64Marker) + base64Marker.length
    const attachment = Attachment.filterClientSideFields(value)
    attachment.content = value.content.substring(base64Index)
    attachment.attachmentRelatedObjects.relatedObjectUuid = relatedObjectUuid
    return API.mutation(operation, { attachment })
  }

  function deleteAttachment(uuid) {
    const newAttachments = attachmentList.filter(item => item.uuid !== uuid) // remove note
    API.mutation(GQL_DELETE_ATTACHMENT, { uuid })
      .then(data => {
        setError(null)
        setAttachmentList(newAttachments) // remove note
        toast.error("Your attachment has been successfully deleted")
      })
      .catch(error => {
        setError(error)
      })
  }

  function showEditAttachmentModal(key) {
    setError(null)
    setShowEditModal(key)
  }

  function cancelEditAttachmentModal() {
    setError(null)
    setShowEditModal(null)
  }

  function hideEditAttachmentModal(attach) {
    const newAttachmentList = attachmentList.filter(
      item => item.uuid !== attach.uuid
    ) // remove old note
    setError(null)
    setShowEditModal(null)
    setAttachmentList(newAttachmentList)
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
