import useLayout from "layouts/useLayout"
import { LAYOUT_AGGREGATORS } from "layouts/utils"
import PropTypes from "prop-types"
import React from "react"

const Chart = ({ items, layoutType, element: Element, style }) => {
  const aggregator = LAYOUT_AGGREGATORS[layoutType]
  const [aggregatedItems, aggregationKey] = aggregator(items)
  const [ChartElement, layout, initViewState, ref] = useLayout(
    layoutType,
    aggregationKey
  )

  return (
    <svg ref={ref} style={style}>
      <ChartElement
        items={aggregatedItems}
        layout={layout}
        element={Element}
        initViewState={initViewState}
      />
    </svg>
  )
}
Chart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  layoutType: PropTypes.string,
  element: PropTypes.func,
  style: PropTypes.object
}
export default Chart
