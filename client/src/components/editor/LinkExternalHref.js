import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import PropTypes from "prop-types"
import React from "react"

const LinkExternalHref = ({ url, children }) => {
  return (
    <a href={url} target="_blank" rel="noreferrer">
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

LinkExternalHref.propTypes = {
  url: PropTypes.string,
  children: PropTypes.node
}

export default LinkExternalHref
