import HeatWidget from "components/aggregations/HeatWidget"
import Chart from "components/Chart"
import { LAYOUT_TYPES } from "layouts"
import PropTypes from "prop-types"
import React, { useState } from "react"

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
        element={HeatWidget}
        style={style}
      />
    </div>
  )
}
HeatMap.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
  style: PropTypes.object
}

export default HeatMap
