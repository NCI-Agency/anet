import useLayout from "layouts/useLayout"
import { LAYOUT_AGGREGATORS } from "layouts/utils"
import PropTypes from "prop-types"
import React from "react"

const Chart = ({ items, layoutType, widgetElement, widgetConfig, style }) => {
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
        widgetElement={widgetElement}
        initViewState={initViewState}
        widgetConfig={widgetConfig}
      />
    </svg>
  )
}
Chart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  layoutType: PropTypes.string,
  widgetElement: PropTypes.func,
  style: PropTypes.object,
  widgetConfig: PropTypes.object
}
export default Chart
