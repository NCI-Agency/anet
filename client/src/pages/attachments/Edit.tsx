import {
  gqlAllAttachmentFields,
  gqlAttachmentRelatedObjectsFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
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
      ${gqlAllAttachmentFields}
      ${gqlAttachmentRelatedObjectsFields}
      author {
        ${gqlEntityFieldsMap.Person}
      }
    }
  }
`

interface AttachmentEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const AttachmentEdit = ({ pageDispatchers }: AttachmentEditProps) => {
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
        title={`Attachment ${attachment.caption}`}
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(AttachmentEdit)
