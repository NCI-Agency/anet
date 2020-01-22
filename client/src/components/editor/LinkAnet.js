import PropTypes from "prop-types"
import React from "react"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import LinkExternalEntity from "components/editor/LinkExternalEntity"
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
    // Non-ANET entity link
    return <LinkExternalEntity url={urlLink}>{children}</LinkExternalEntity>
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
