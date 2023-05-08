import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import ConfirmDestructive from "components/ConfirmDestructive"
import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"
import { Card } from "react-bootstrap"
import { toast } from "react-toastify"
import pdf from "resources/newPDF.svg"
import "./Attachment.css"

const GQL_DELETE_ATTACHMENT = gql`
  mutation ($uuid: String!) {
    deleteAttachment(uuid: $uuid)
  }
`

const AttachmentCard = ({
  file,
  show,
  remove,
  setError,
  setRemove,
  uploadedList,
  setUploadedList
}) => {
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
    <div key={file.uuid} style={{ width: "20%" }}>
      <Card>
        <div
          className="imagePreview info-show card-image"
          style={{
            backgroundSize: file.mimeType.includes("pdf") ? "50px" : "cover",
            backgroundImage: file.mimeType.includes("pdf")
              ? `url(${pdf})`
              : file.content.includes("data")
                ? `url(${file.content})`
                : `url(data:${file.mimeType};base64,${file.content})`
          }}
        >
          <div className="file-info image-info">
            <div style={{ display: "grid" }}>
              <LinkTo
                className="detail-btn"
                modelType="Attachment"
                model={file}
              >
                {" "}
              </LinkTo>
            </div>
          </div>
        </div>
        <Card.Body className={`p-1 ${!show ? "d-none" : "d-block"}`}>
          <Card.Title style={{ fontSize: "15px" }} className="info-line">
            {file?.fileName?.substring(0, 8)}...
            <span>{returnFileSize(file?.content?.length)}</span>
          </Card.Title>
          <div className="info-line">
            <div>
              <LinkTo
                modelType="Attachment"
                edit
                model={file}
                button="outline-primary"
              >
                <Icon icon={IconNames.EDIT} className="icon edit" />
              </LinkTo>
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
    </div>
  )

  function deleteAttachment(uuid) {
    const newAttachments = uploadedList.filter(item => item.uuid !== uuid)
    API.mutation(GQL_DELETE_ATTACHMENT, { uuid })
      .then(data => {
        setUploadedList(newAttachments)
        if (!remove) {
          setRemove(true)
        }
        toast.error("Your attachment has been successfully deleted")
      })
      .catch(error => {
        setError(error)
      })
  }
}

AttachmentCard.propTypes = {
  file: PropTypes.object,
  show: PropTypes.bool,
  remove: PropTypes.bool,
  setError: PropTypes.func,
  setRemove: PropTypes.func,
  uploadedList: PropTypes.array,
  setUploadedList: PropTypes.func
}

AttachmentCard.defaultProps = {
  show: true,
  remove: undefined
}

export default AttachmentCard
