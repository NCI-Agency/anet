import { gql } from "@apollo/client"
import API from "api"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React from "react"
import ShowUploadedAttachments from "./ShowUploadedAttachments"

const GQL_GET_RELATED_ATTACHMENTS = gql`
  query ($uuid: String!) {
    relatedObjectAttachments(uuid: $uuid) {
      ${Attachment.basicFieldsQuery}
    }
  }
`

const UploadedAttachments = ({ uuid }) => {
  const { data } = API.useApiQuery(GQL_GET_RELATED_ATTACHMENTS, {
    uuid
  })
  const uploadedList = data
    ? Attachment.fromArray(data.relatedObjectAttachments)
    : []

  return <ShowUploadedAttachments attachmentList={uploadedList} />
}

UploadedAttachments.propTypes = {
  uuid: PropTypes.string.isRequired
}

export default UploadedAttachments
