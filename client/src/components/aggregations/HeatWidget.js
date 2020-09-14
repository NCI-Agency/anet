import PropTypes from "prop-types"
import React from "react"

const HeatWidget = ({ item }) => {
  return <rect>{item}</rect>
}
HeatWidget.propTypes = {
  item: PropTypes.object
}
export default HeatWidget
