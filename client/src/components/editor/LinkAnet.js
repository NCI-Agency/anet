import LinkAnetEntity from "components/editor/LinkAnetEntity"
import parse from "html-react-parser"
import PropTypes from "prop-types"
import React from "react"
import { getEntityInfoFromUrl } from "utils_links"

// Enhanced HTML so that links will be converted to LinkTo components
export function parseHtmlWithLinkTo(html) {
  if (!html) {
    return null
  }
  return parse(html, {
    replace: domNode => {
      if (domNode.attribs && domNode.attribs.href) {
        return <LinkAnet url={domNode.attribs.href} />
      }
    }
  })
}

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
      <LinkAnetEntity
        type={isAnetEntityLink.type}
        uuid={isAnetEntityLink.uuid}
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
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
  children: PropTypes.any,
  url: PropTypes.string
}

export default LinkAnet
