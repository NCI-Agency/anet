import { gql } from "@apollo/client"
import API from "api"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React from "react"
import ShowUplaodedAttachments from "./ShowUploadedAttachments"

const GQL_GET_RELATED_ATTACHMENTS = gql`
  query ($uuid: String!) {
    getAttachmentsForRelatedObject(uuid: $uuid) {
      uuid
      fileName
      mimeType
      classification
      attachmentRelatedObjects {
        relatedObjectType
        relatedObjectUuid
      }
    }
  }
`

const UploadedAttachments = ({ uuid }) => {
  const { data } = API.useApiQuery(GQL_GET_RELATED_ATTACHMENTS, {
    uuid
  })
  const uploadedList = data
    ? Attachment.fromArray(data.getAttachmentsForRelatedObject)
    : []

  return (
    <>
      <ShowUplaodedAttachments attachmentList={uploadedList} />
    </>
  )
}

UploadedAttachments.propTypes = {
  uuid: PropTypes.string
}

export default UploadedAttachments
