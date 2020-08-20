import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Element } from "react-scroll"

const Fieldset = ({ id, title, action, style, ...otherProps }) => (
  <Element id={id} name={id} className="scroll-anchor-container" style={style}>
    {(title || action) && (
      <div
        className="legend"
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "flex-start"
        }}
      >
        <h4 className="title-text" style={{ flexGrow: 0 }}>
          {title}
        </h4>
        {action}
      </div>
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
