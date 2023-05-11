import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import RichTextEditor from "components/RichTextEditor"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Col, Row } from "react-bootstrap"
import pdf from "resources/newPDF.svg"

const GQL_GET_ATTACHMENT = gql`
  query ($uuid: String) {
    attachment(uuid: $uuid) {
      uuid
      fileName
      mimeType
      classification
      description
      attachmentRelatedObjects {
        relatedObjectType
        relatedObjectUuid
      }
      author {
        uuid
        name
        avatar
      }
    }
  }
`

const AttachmentPreview = ({ className, uuid }) => {
  const { data, error } = API.useApiQuery(GQL_GET_ATTACHMENT, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const attachment = new Attachment(data.attachment ? data.attachment : {})

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4>{`Attachment ${attachment.fileName}`}</h4>
      </div>
      <div className="preview-section">
        <Row>
          <Col>
            <Col xs={12} sm={12} className="label-align">
              <img
                alt={attachment.fileName}
                src={
                  attachment.mimeType.includes("pdf")
                    ? pdf
                    : `/api/attachment/view/${attachment.uuid}`
                }
                style={{ width: "100%", borderRadius: "5px" }}
              />
            </Col>
            <PreviewField label="File name" value={attachment.fileName} />
            <PreviewField
              label="Owner"
              value={<LinkTo modelType="Person" model={attachment.author} />}
            />
            <PreviewField label="Mime type" value={attachment.mimeType} />
            <PreviewField
              label="Classification"
              value={Attachment.humanNameOfStatus(
                attachment.classification
              ).toUpperCase()}
            />
          </Col>
        </Row>

        <div className="preview-field-label">Description</div>
        <div className="preview-field-value">
          <RichTextEditor readOnly value={attachment.description} />
        </div>
      </div>
    </div>
  )
}

AttachmentPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default AttachmentPreview
