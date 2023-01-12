import LinkAnetEntity from "components/editor/LinkAnetEntity"
import PropTypes from "prop-types"
import React from "react"
import { getEntityInfoFromUrl } from "utils_links"

const LinkAnet = ({ entityKey, contentState, url, displayCallback }) => {
  const urlLink =
    url || (contentState && contentState.getEntity(entityKey).getData().url)

  const isAnetEntityLink = getEntityInfoFromUrl(urlLink)

  if (isAnetEntityLink) {
    return (
      <LinkAnetEntity
        type={isAnetEntityLink.type}
        uuid={isAnetEntityLink.uuid}
        displayCallback={displayCallback}
      />
    )
  } else {
    // Non ANET entity link
    return <>{urlLink}</>
  }
}

LinkAnet.propTypes = {
  entityKey: PropTypes.string,
  contentState: PropTypes.object,
  url: PropTypes.string,
  displayCallback: PropTypes.func
}

LinkAnet.defaultProps = {
  displayCallback: null
}

export default LinkAnet
