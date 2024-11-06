import * as d3 from "d3"
import React, { useEffect } from "react"

const TOOLTIP_ID = "tooltip-top"
const MOUSE_OFFSET_X = 25
const MOUSE_OFFSET_Y = -25

const getD3TooltipElement = () => d3.select(`#${TOOLTIP_ID}`)

export const addD3Tooltip = (chartElement, tooltip, hideOnClick) => {
  const tooltipElement = getD3TooltipElement()
  if (tooltip && tooltipElement) {
    chartElement
      .on("mouseover", () => {
        tooltipElement.style("display", null)
      })
      .on("mouseout", () => {
        tooltipElement.style("display", "none")
      })
      .on("mousemove", (event, d) => {
        tooltipElement
          .style("left", `${event.pageX + MOUSE_OFFSET_X}px`)
          .style("top", `${event.pageY + MOUSE_OFFSET_Y}px`)
          .html(tooltip(d))
      })
    if (hideOnClick) {
      chartElement.on("mouseup", () => {
        tooltipElement.style("display", "none")
      })
    }
  }
}

export const D3Tooltip = () => {
  useEffect(() => () => getD3TooltipElement()?.style("display", "none"))
  return (
    <div id={TOOLTIP_ID} className="tooltip-top" style={{ display: "none" }} />
  )
}
