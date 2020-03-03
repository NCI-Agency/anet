import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Element } from "react-scroll"

const Fieldset = ({ id, title, action, style, ...otherProps }) => (
  <Element id={id} name={id} className="scroll-anchor-container" style={style}>
    {(title || action) && (
      <h2 className="legend">
        <span className="title-text">{title}</span>
        {action && <small>{action}</small>}
      </h2>
    )}

    {!_isEmpty(otherProps) && <fieldset style={style} {...otherProps} />}
  </Element>
)
Fieldset.propTypes = {
  id: PropTypes.string,
  title: PropTypes.node,
  action: PropTypes.node,
  style: PropTypes.object
}

export default Fieldset
