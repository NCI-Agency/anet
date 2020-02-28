import PropTypes from "prop-types"
import React from "react"

const Checkbox = props => (
  <div className="checkbox">
    <label>
      <input
        className="checkbox"
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
      />
      {props.label}
    </label>
  </div>
)
Checkbox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.string
}
Checkbox.defaultProps = {
  checked: false,
  label: ""
}

export default Checkbox
