import PropTypes from "prop-types"
import React from "react"

import "./Icon.css"

/**
 * Icon as SVG element. Can optionally render a React element instead.
 */
const Icon = ({ icon, title, className, width, height, viewBox }) => {
  const isPathOrRef = typeof icon === "string"
  let children

  if (isPathOrRef) {
    if (icon.includes("#")) {
      children = <use xlinkHref={icon} />
    } else {
      children = <path d={icon} />
    }
  } else if (Array.isArray(icon)) {
    children = icon.map((d, i) => <path key={i} d={d} />)
  } else {
    return icon
  }

  return (
    <svg
      width={width || "16"}
      height={height || "16"}
      viewBox={viewBox || "0 0 1024 1024"}
      className={`Draftail-Icon ${className || ""}`}
      aria-hidden={title ? null : true}
      role={title ? "img" : null}
      aria-label={title || null}
    >
      {children}
    </svg>
  )
}

Icon.propTypes = {
  // The icon definition is very flexible.
  icon: PropTypes.oneOfType([
    // String icon = SVG path or symbol reference.
    PropTypes.string,
    // List of SVG paths.
    PropTypes.arrayOf(PropTypes.string),
    // Arbitrary React element.
    PropTypes.node
  ]).isRequired,
  title: PropTypes.string,
  className: PropTypes.string,
  width: PropTypes.string,
  height: PropTypes.string,
  viewBox: PropTypes.string
}

Icon.defaultProps = {
  title: null,
  className: null
}

export default Icon
