import classNames from "classnames"
import { CompactRow } from "components/Compact"
import _isEmpty from "lodash/isEmpty"
import React from "react"
import { Element } from "react-scroll"

interface FieldsetProps {
  id?: string
  title?: React.ReactNode
  action?: React.ReactNode
  description?: React.ReactNode
  style?: any
  isCompact?: boolean
}

const Fieldset = ({
  id,
  title,
  action,
  description,
  style,
  isCompact,
  ...otherProps
}: FieldsetProps) => {
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
      className="scroll-anchor-container w-100"
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

export default Fieldset
