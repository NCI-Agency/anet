import { gql } from "@apollo/client"
import API from "api"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import RichTextEditor from "components/RichTextEditor"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React from "react"
import { Col, Row } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const GQL_GET_ATTACHMENT = gql`
  query ($uuid: String) {
    attachment(uuid: $uuid) {
      ${Attachment.basicFieldsQuery}
      author {
        uuid
        name
        rank
        avatarUuid
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
  const { backgroundImage } = utils.getAttachmentIconDetails(attachment)

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4 className="ellipsized-text">{`Attachment ${attachment.caption}`}</h4>
      </div>
      <div className="preview-section">
        <Row>
          <Col>
            <Col xs={12} sm={12} className="label-align">
              <img
                alt={attachment.fileName}
                src={backgroundImage}
                style={{ width: "100%", borderRadius: "5px" }}
              />
            </Col>
            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.attachment.fileName}
              value={attachment.fileName}
            />
            <PreviewField
              label="Owner"
              value={<LinkTo modelType="Person" model={attachment.author} />}
            />
            <PreviewField label="MIME type" value={attachment.mimeType} />
            <PreviewField
              label="Content length"
              value={utils.humanReadableFileSize(attachment.contentLength)}
            />
            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.classification}
              value={Settings.classification.choices[attachment.classification]}
            />
          </Col>
        </Row>

        <div className="preview-field-label">
          {Settings.fields.attachment.description?.label}
        </div>
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
