import _isEmpty from "lodash/isEmpty"
import { CompactRow } from "pages/reports/Compact"
import PropTypes from "prop-types"
import React from "react"
import { Element } from "react-scroll"
const Fieldset = ({
  id,
  title,
  action,
  style,
  compactStyle,
  ...otherProps
}) => {
  if (compactStyle) {
    return (
      <CompactRow
        label={title}
        content={
          !_isEmpty(otherProps) && (
            <table>
              <tbody {...otherProps} />
            </table>
          )
        }
        style={compactStyle}
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
  compactStyle: PropTypes.object
}

export default Fieldset
