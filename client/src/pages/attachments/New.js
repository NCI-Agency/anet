import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Attachment } from "models"
import React from "react"
import { connect } from "react-redux"
import AttachmentForm from "./Form"

const AttachmentNew = ({ pageDispatchers }) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Attachment")

  const attachment = new Attachment()

  return (
    <div className="attachment-new">
      <AttachmentForm
        initialValues={attachment}
        title="Create a new Attachment"
      />
    </div>
  )
}

AttachmentNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(AttachmentNew)
