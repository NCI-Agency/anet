import classNames from "classnames"
import { CompactRow } from "components/Compact"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Element } from "react-scroll"

const Fieldset = ({
  id,
  title,
  action,
  description,
  style,
  isCompact,
  ...otherProps
}) => {
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
        <h4 className="legend">
          <span
            className={classNames("title-text", "ellipsized-text", {
              "limit-title-text": action
            })}
          >
            {title}
          </span>
          {action && <small className="action-small">{action}</small>}
        </h4>
      )}
      {description && <div className="form-text">{description}</div>}
      {!_isEmpty(otherProps) && <fieldset style={style} {...otherProps} />}
    </Element>
  )
}
Fieldset.propTypes = {
  id: PropTypes.string,
  title: PropTypes.node,
  action: PropTypes.node,
  description: PropTypes.node,
  style: PropTypes.object,
  isCompact: PropTypes.bool
}

export default Fieldset
