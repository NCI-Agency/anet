import PropTypes from "prop-types"
import React from "react"
import LinkAnetEntity from "components/editor/LinkAnetEntity"

const LinkAnet = ({ entityKey, contentState, children, onEdit, onRemove }) => {
  return (
    <LinkAnetEntity
      entityKey={entityKey}
      contentState={contentState}
    >
      {children}
    </LinkAnetEntity>
  )
}

LinkAnet.propTypes = {
  entityKey: PropTypes.string.isRequired,
  contentState: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  children: PropTypes.any
}

export default LinkAnet
