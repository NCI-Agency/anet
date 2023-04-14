import { gql } from "@apollo/client"
import API from "api"
import PropTypes from "prop-types"
import React from "react"

const GQL_GET_RELATED_ATTACHMENTS = gql`
  query ($uuid: String!) {
    getAttachmentsForRelatedObject(uuid: $uuid) {
      uuid
      fileName
      content
    }
  }
`

const ShowUplaodedAttachments = ({ relatedObjectUuid }) => {
  const { data } = API.useApiQuery(GQL_GET_RELATED_ATTACHMENTS, {
    relatedObjectUuid
  })
  console.log(data)
  return <div>file</div>
}

ShowUplaodedAttachments.propTypes = {
  relatedObjectUuid: PropTypes.string
}

export default ShowUplaodedAttachments
