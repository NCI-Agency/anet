import { Tooltip } from "@blueprintjs/core"
import React from "react"
import "./ModelTooltip.css"

interface ModelTooltipProps {
  children?: React.ReactNode
  tooltipContent?: React.ReactNode
}

const ModelTooltip = ({
  tooltipContent,
  children,
  ...tooltipProps
}: ModelTooltipProps) => {
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

export default ModelTooltip
