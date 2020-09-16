import PropTypes from "prop-types"

const geoLayout = (item, dimensions) => {
  // FIXME: do something useful instead
  return {
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height
  }
}
geoLayout.propTypes = {
  item: PropTypes.object,
  dimensions: PropTypes.object
}
export default geoLayout
