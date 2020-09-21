import HeatWidget from "components/aggregations/HeatWidget"
import Chart from "components/Chart"
import { LAYOUT_TYPES } from "layouts/utils"
import PropTypes from "prop-types"
import React, { useState } from "react"

// TODO: this config can come from layouts/utils or be input to HeatMap or input from user
const heatConfig = {
  low: 3,
  mid: 6,
  bgColor: "white",
  textColor: "black"
}
const HeatMap = ({ items, style }) => {
  const [layout, setLayout] = useState(LAYOUT_TYPES.YEAR)
  return (
    <div>
      <div>
        <label htmlFor="layouts">Layout:</label>
        <select
          value={layout}
          name="layouts"
          id="layouts"
          onChange={e => setLayout(e.target.value)}
        >
          <option value={LAYOUT_TYPES.MONTH}>Month</option>
          <option value={LAYOUT_TYPES.YEAR}>Year</option>
          {/* FIXME: Add geo option when ready */}
          {/* <option value={LAYOUT_TYPES.GEO}>Geo</option> */}
        </select>
      </div>
      <Chart
        items={items}
        layoutType={layout}
        widgetElement={HeatWidget}
        style={style}
        widgetConfig={heatConfig}
      />
    </div>
  )
}
HeatMap.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  style: PropTypes.object
}

export default HeatMap
