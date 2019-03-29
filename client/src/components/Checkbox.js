import React from "react"

const Checkbox = props => {
  return (
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
}

export default Checkbox
