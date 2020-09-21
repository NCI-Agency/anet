import PropTypes from "prop-types"
import React from "react"

const DateChart = ({
  items,
  layout,
  widgetElement: Widget,
  initViewState: viewDate,
  widgetConfig
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
            key={item[item.aggregationKey]}
          >
            <Widget
              item={item}
              dimensions={boundingRect}
              widgetConfig={widgetConfig}
            />
          </g>
        )
      })}
    </>
  )
}
DateChart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  widgetElement: PropTypes.func,
  layout: PropTypes.func,
  initViewState: PropTypes.object,
  widgetConfig: PropTypes.object
}
export default DateChart
