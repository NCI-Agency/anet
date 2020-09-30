import useLayout from "layouts/useLayout"
import { LAYOUT_AGGREGATORS } from "layouts/utils"
import PropTypes from "prop-types"
import React, { useState } from "react"

const Chart = ({
  items,
  layoutType,
  widgetElement: Widget,
  widgetConfig,
  style
}) => {
  const aggregator = LAYOUT_AGGREGATORS[layoutType]
  const [aggregatedItems] = aggregator(items)
  const [HeaderElement, layout, initViewState, ref] = useLayout(layoutType)

  const [viewState, setViewState] = useState(initViewState)

  return (
    <>
      <HeaderElement viewState={viewState} setViewState={setViewState} />
      <svg ref={ref} style={style}>
        {aggregatedItems.map(item => {
          const boundingRect = layout(item, viewState)
          // if it isn't in the layout ( e.g different year, month)
          if (!boundingRect) {
            return null
          }
          return (
            <g
              transform={`translate(${boundingRect.x}, ${boundingRect.y})`}
              key={JSON.stringify(item)}
            >
              <Widget
                item={item}
                dimensions={boundingRect}
                widgetConfig={widgetConfig}
              />
            </g>
          )
        })}
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
