import { CompactRow } from "components/Compact"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Element } from "react-scroll"

const Fieldset = ({ id, title, action, style, isCompact, ...otherProps }) => {
  if (isCompact) {
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
          {action && <small className="action-small">{action}</small>}
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
  isCompact: PropTypes.bool
}

export default Fieldset
