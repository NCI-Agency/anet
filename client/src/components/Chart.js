import useLayout from "layouts/useLayout"
import PropTypes from "prop-types"
import React, { useEffect } from "react"

const Chart = ({ items, layoutType, element: Element, style, viewDate }) => {
  const [ref, layout] = useLayout(layoutType, viewDate)
  useEffect(() => {}, [])
  return (
    <svg ref={ref} style={style}>
      {items.map(item => {
        const rectDim = layout(item)
        if (!rectDim) {
          return null
        }
        return (
          <g transform={`translate(${rectDim.x}, ${rectDim.y})`} key={item.id}>
            <Element item={item} dimensions={rectDim} />
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
