import { Icon, IconSize, Intent } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import React from "react"

interface LinkExternalHrefProps {
  url?: string
  children?: React.ReactNode
  attributes?: any
}

const LinkExternalHref = ({
  url,
  children,
  attributes
}: LinkExternalHrefProps) => {
  return (
    <a href={url} target="_blank" {...attributes} rel="noreferrer">
      {children}
      <Icon
        icon={IconNames.SHARE}
        intent={Intent.PRIMARY}
        size={IconSize.STANDARD * 0.75}
        style={{ marginLeft: "2px", paddingBottom: "5px" }}
      />
    </a>
  )
}

export default LinkExternalHref
