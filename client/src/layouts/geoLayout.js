import PropTypes from "prop-types"
import React from "react"

const geoLayout = ({ item, dimensions }) => {
  return (
    <>
      Hello {item} {dimensions}
    </>
  )
}
geoLayout.propTypes = {
  item: PropTypes.object,
  dimensions: PropTypes.object
}
export default geoLayout
