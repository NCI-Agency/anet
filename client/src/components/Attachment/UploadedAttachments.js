import { gql } from "@apollo/client"
import API from "api"
import { Attachment } from "models"
import PropTypes from "prop-types"
import React from "react"
import ShowUploadedAttachments from "./ShowUploadedAttachments"

const GQL_GET_RELATED_ATTACHMENTS = gql`
  query ($uuid: String!) {
    relatedObjectAttachments(uuid: $uuid) {
      uuid
      fileName
      contentLength
      mimeType
      classification
      description
      author {
        uuid
        name
        rank
        role
        avatar(size: 32)
      }
      attachmentRelatedObjects {
        relatedObject {
          ... on AuthorizationGroup {
            name
          }
          ... on Location {
            name
          }
          ... on Organization {
            shortName
          }
          ... on Person {
            name
            rank
            role
            avatar(size: 32)
          }
          ... on Position {
            type
            name
          }
          ... on Report {
            intent
          }
          ... on Task {
            shortName
          }
        }
        relatedObjectUuid
        relatedObjectType
      }
    }
  }
`

const UploadedAttachments = ({ uuid, removeable }) => {
  const { data } = API.useApiQuery(GQL_GET_RELATED_ATTACHMENTS, {
    uuid
  })
  const uploadedList = data
    ? Attachment.fromArray(data.relatedObjectAttachments)
    : []

  return (
    <ShowUploadedAttachments
      removeable={removeable}
      attachmentList={uploadedList}
    />
  )
}

UploadedAttachments.propTypes = {
  uuid: PropTypes.string.isRequired,
  removeable: PropTypes.bool
}

export default UploadedAttachments
