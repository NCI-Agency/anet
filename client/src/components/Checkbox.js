import PropTypes from "prop-types"
import React, { useEffect, useRef } from "react"

const Checkbox = ({ checked, onChange, label }) => {
  const inputRef = useRef(null)
  useEffect(() => {
    const input = inputRef.current
    if (input) {
      input.checked = checked
      input.indeterminate = checked == null
    }
  }, [checked])

  return (
    <div className="checkbox">
      <label className="d-flex align-items-center column-gap-1">
        <input
          className="checkbox"
          type="checkbox"
          ref={inputRef}
          onChange={onChange}
        />
        {label}
      </label>
    </div>
  )
}
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
