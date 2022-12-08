import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import LinkAnetEntity from "components/editor/LinkAnetEntity"
import PropTypes from "prop-types"
import React from "react"
import { getEntityInfoFromUrl } from "utils_links"

const LinkAnet = ({
  entityKey,
  contentState,
  url,
  displayCallback,
  children
}) => {
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
    return (
      <a href={urlLink}>
        {children}{" "}
        <Icon
          icon={IconNames.SHARE}
          intent={Intent.PRIMARY}
          size={IconSize.STANDARD * 0.75}
          style={{ paddingBottom: "5px" }}
        />
      </a>
    )
  }
}

LinkAnet.propTypes = {
  entityKey: PropTypes.string,
  contentState: PropTypes.object,
  url: PropTypes.string,
  displayCallback: PropTypes.func,
  children: PropTypes.node
}

LinkAnet.defaultProps = {
  displayCallback: null
}

export default LinkAnet
