import PropTypes from "prop-types"
import React from "react"

import TooltipEntity from "./TooltipEntity"

const Link = ({ entityKey, contentState, children, onEdit, onRemove }) => {
  const { url, linkType } = contentState.getEntity(entityKey).getData()
  const isEmailLink = linkType === "email" || url.startsWith("mailto:")
  const icon = `#icon-${isEmailLink ? "mail" : "link"}`
  const label = url.replace(/(^\w+:|^)\/\//, "").split("/")[0]

  return (
    <TooltipEntity
      entityKey={entityKey}
      contentState={contentState}
      onEdit={onEdit}
      onRemove={onRemove}
      icon={icon}
      label={label}
    >
      {children}
    </TooltipEntity>
  )
}

Link.propTypes = {
  entityKey: PropTypes.string.isRequired,
  contentState: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  children: PropTypes.any
}

export default Link
