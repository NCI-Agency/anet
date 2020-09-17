import useLayout from "layouts/useLayout"
import PropTypes from "prop-types"
import React from "react"

const Chart = ({ items, layoutType, element: Element, style, viewDate }) => {
  const [ref, layout, uniqueKey] = useLayout(layoutType, viewDate)

  return (
    <svg ref={ref} style={style}>
      {items.map(item => {
        const boundingRect = layout(item)
        // if it wasn't in the layout ( Ex: different year, month)
        if (!boundingRect) {
          return null
        }
        return (
          <g
            transform={`translate(${boundingRect.x}, ${boundingRect.y})`}
            key={item[uniqueKey]}
          >
            <Element item={item} dimensions={boundingRect} />
          </g>
        )
      })}
    </svg>
  )
}
Chart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  layoutType: PropTypes.string,
  element: PropTypes.func,
  style: PropTypes.object,
  viewDate: PropTypes.object
}
export default Chart
