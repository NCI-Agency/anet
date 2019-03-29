import React from "react"
import { Label, OverlayTrigger, Tooltip } from "react-bootstrap"

const Tag = ({ tag }) => {
  var tagDisplay
  tagDisplay = (
    <Label bsStyle="info" className="reportTag">
      {tag.name}
    </Label>
  )
  if (tag.description) {
    tagDisplay = (
      <OverlayTrigger
        trigger="click"
        placement="bottom"
        overlay={<Tooltip id="tooltip">{tag.description}</Tooltip>}
      >
        {tagDisplay}
      </OverlayTrigger>
    )
  }
  return tagDisplay
}

export default Tag
