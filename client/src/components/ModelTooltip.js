import { Tooltip2 } from "@blueprintjs/popover2"
import PropTypes from "prop-types"
import React from "react"
import "./ModelTooltip.css"

const ModelTooltip = ({ tooltipContent, children, ...tooltipProps }) => {
  return (
    <Tooltip2
      style={{ overflow: "auto" }}
      content={tooltipContent}
      {...tooltipProps}
    >
      {children}
    </Tooltip2>
  )
}

ModelTooltip.propTypes = {
  children: PropTypes.node,
  tooltipContent: PropTypes.node
}

export default ModelTooltip
