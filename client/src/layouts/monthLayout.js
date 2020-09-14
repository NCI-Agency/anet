import PropTypes from "prop-types"
import React from "react"

const monthLayout = ({ item, dimensions }) => {
  return (
    <>
      Hello {item} {dimensions}
    </>
  )
}
monthLayout.propTypes = {
  item: PropTypes.object,
  dimensions: PropTypes.object
}
export default monthLayout
