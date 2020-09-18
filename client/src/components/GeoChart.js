import PropTypes from "prop-types"
import React from "react"

const GeoChart = ({ items }) => {
  return <>{items.title}</>
}
GeoChart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object)
}
export default GeoChart
