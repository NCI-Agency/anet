import PropTypes from "prop-types"
import React from "react"
// TODO: add color scales
const HeatWidget = ({ item, dimensions }) => {
  return (
    <>
      <rect
        width={dimensions.width}
        height={dimensions.height}
        stroke="#aaa"
        strokeWidth="2"
        fill="#fff"
      />
      <text
        x={dimensions.width / 2}
        y={dimensions.height / 2}
        dominantBaseline="middle"
        fontSize="12"
        strokeWidth="0"
        stroke="#000"
        textAnchor="middle"
      >
        {item.numOfEvents}
      </text>
    </>
  )
}
HeatWidget.propTypes = {
  item: PropTypes.object,
  dimensions: PropTypes.object
}
export default HeatWidget
