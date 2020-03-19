import LinkAnetEntity from "components/editor/LinkAnetEntity"
import PropTypes from "prop-types"
import React from "react"
import { getEntityInfoFromUrl } from "utils_links"

const LinkAnet = ({
  entityKey,
  contentState,
  children,
  onEdit,
  onRemove,
  url
}) => {
  const urlLink =
    url || (contentState && contentState.getEntity(entityKey).getData().url)

  const isAnetEntityLink = getEntityInfoFromUrl(urlLink)

  if (isAnetEntityLink) {
    return (
      <LinkAnetEntity type={isAnetEntityLink.type} uuid={isAnetEntityLink.uuid}>
        {children}
      </LinkAnetEntity>
    )
  } else {
    // Non ANET entity link
    return <>{urlLink}</>
  }
}

LinkAnet.propTypes = {
  entityKey: PropTypes.string,
  contentState: PropTypes.object,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
  children: PropTypes.any,
  url: PropTypes.string
}

export default LinkAnet
