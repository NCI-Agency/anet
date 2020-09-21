import useLayout from "layouts/useLayout"
import { LAYOUT_AGGREGATORS } from "layouts/utils"
import PropTypes from "prop-types"
import React, { useState } from "react"

const Chart = ({ items, layoutType, widgetElement, widgetConfig, style }) => {
  const aggregator = LAYOUT_AGGREGATORS[layoutType]
  const [aggregatedItems] = aggregator(items)
  const [ChartElement, HeaderElement, layout, initViewState, ref] = useLayout(
    layoutType
  )

  const [viewState, setViewState] = useState(initViewState)

  return (
    <>
      <HeaderElement viewState={viewState} setViewState={setViewState} />
      <svg ref={ref} style={style}>
        <ChartElement
          items={aggregatedItems}
          layout={layout}
          widgetElement={widgetElement}
          viewState={viewState}
          widgetConfig={widgetConfig}
        />
      </svg>
    </>
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
