import { Tooltip } from "@blueprintjs/core"
import PropTypes from "prop-types"
import React from "react"
import "./ModelTooltip.css"

const ModelTooltip = ({ tooltipContent, children, ...tooltipProps }) => {
  return (
    <Tooltip
      style={{ overflow: "auto" }}
      content={tooltipContent}
      {...tooltipProps}
    >
      {children}
    </Tooltip>
  )
}

ModelTooltip.propTypes = {
  children: PropTypes.node,
  tooltipContent: PropTypes.node
}

export default ModelTooltip
