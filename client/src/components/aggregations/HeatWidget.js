import { numOfEventsToHeatBgc } from "components/aggregations/utils"
import PropTypes from "prop-types"
import React from "react"

// TODO: add color scales
// TODO: api will probably change
/**
 * @param {object} item - aggregated item in the shape {aggregationKey: string, [aggregationKey]: object, numOfEvents: number}
 * @param {object} dimensions - what view types you want to use
 * @param {object} heatConfig - object in the form {low:number, mid:number, bgColor:string, textColor: string}
 *                              4 levels of tone for event count:  if = 0, if <= low, if <= mid, if > mid
 */
const HeatWidget = ({ item, dimensions, widgetConfig: heatConfig }) => {
  const bgc = numOfEventsToHeatBgc(item.numOfEvents, heatConfig)

  return (
    <>
      <rect
        width={dimensions.width}
        height={dimensions.height}
        stroke="purple"
        strokeWidth="2"
        fill={bgc}
      />
      <text
        x={dimensions.width / 2}
        y={dimensions.height / 2}
        dominantBaseline="middle"
        fontSize="16"
        fill={heatConfig.textColor}
        textAnchor="middle"
      >
        {item.numOfEvents}
      </text>
    </>
  )
}
HeatWidget.propTypes = {
  item: PropTypes.object,
  dimensions: PropTypes.object,
  widgetConfig: PropTypes.object
}
export default HeatWidget
