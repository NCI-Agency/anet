import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import PropTypes from "prop-types"
import React from "react"

const LinkExternalHref = ({ url, children, attributes }) => {
  return (
    <a href={url} target="_blank" {...attributes} rel="noreferrer">
      {children}
      <Icon
        icon={IconNames.SHARE}
        intent={Intent.PRIMARY}
        size={IconSize.STANDARD * 0.75}
        style={{ marginLeft: 2, paddingBottom: "5px" }}
      />
    </a>
  )
}

LinkExternalHref.propTypes = {
  url: PropTypes.string,
  children: PropTypes.node,
  attributes: PropTypes.object
}

export default LinkExternalHref
