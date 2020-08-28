import _isEmpty from "lodash/isEmpty"
import { PrintRow } from "pages/reports/Print"
import PropTypes from "prop-types"
import React from "react"
import { Element } from "react-scroll"
const Fieldset = ({ id, title, action, style, printStyle, ...otherProps }) => {
  if (printStyle) {
    return (
      <PrintRow
        label={title}
        content={
          !_isEmpty(otherProps) && (
            <table>
              <tbody {...otherProps} />
            </table>
          )
        }
        style={printStyle}
      />
    )
  }

  return (
    <Element
      id={id}
      name={id}
      className="scroll-anchor-container"
      style={style}
    >
      {(title || action) && (
        <h2 className="legend">
          <span className="title-text">{title}</span>
          {action && <small>{action}</small>}
        </h2>
      )}

      {!_isEmpty(otherProps) && <fieldset style={style} {...otherProps} />}
    </Element>
  )
}
Fieldset.propTypes = {
  id: PropTypes.string,
  title: PropTypes.node,
  action: PropTypes.node,
  style: PropTypes.object,
  printStyle: PropTypes.object
}

export default Fieldset
