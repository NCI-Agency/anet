import useLayout from "layouts/useLayout"
import PropTypes from "prop-types"
import React from "react"

const Chart = ({ items, layoutType, element: Element }) => {
  const [ref, layout] = useLayout(layoutType)

  return (
    <svg ref={ref}>
      {items.map(item => (
        <g
          transform={`translate(${layout(item).x}, ${layout(item).y})`}
          key={item.id}
        >
          <Element item={item} />
        </g>
      ))}
    </svg>
  )
}
Chart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  layoutType: PropTypes.func,
  element: PropTypes.node
}
export default Chart
