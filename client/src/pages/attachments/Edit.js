import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Attachment } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import AttachmentForm from "./Form"

const GQL_GET_ATTACHMENT = gql`
  query ($uuid: String) {
    attachment(uuid: $uuid) {
      uuid
      fileName
      contentLength
      mimeType
      classification
      description
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
      author {
        uuid
        name
        rank
        role
        avatar(size: 32)
      }
    }
  }
`

const AttachmentEdit = ({ pageDispatchers }) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_ATTACHMENT, { uuid })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Attachment",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(
    data?.attachment &&
      `Edit ${data.attachment.fileName || data.attachment.uuid}`
  )
  if (done) {
    return result
  }

  const attachment = new Attachment(data ? data.attachment : {})

  return (
    <div>
      <AttachmentForm
        edit
        initialValues={attachment}
        title={`Attachment #${attachment.uuid}`}
      />
    </div>
  )
}

AttachmentEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(AttachmentEdit)
