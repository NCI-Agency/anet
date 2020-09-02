import PropTypes from "prop-types"
import React from "react"

const DayNameBox = ({ name }) => {
  return <div className="DayNameBox">{name}</div>
}
DayNameBox.propTypes = {
  name: PropTypes.string
}
export default DayNameBox
