import PropTypes from "prop-types"
import React from "react"

const DateChart = ({
  items,
  layout,
  element: Element,
  initViewState: viewDate
}) => {
  return (
    <>
      {items.map(item => {
        const boundingRect = layout(item, viewDate)
        // if it isn't in the layout ( e.g different year, month)
        if (!boundingRect) {
          return null
        }
        return (
          <g
            transform={`translate(${boundingRect.x}, ${boundingRect.y})`}
            key={item.aggregationKey}
          >
            <Element item={item} dimensions={boundingRect} />
          </g>
        )
      })}
    </>
  )
}
DateChart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  element: PropTypes.func,
  layout: PropTypes.func,
  initViewState: PropTypes.object
}
export default DateChart
