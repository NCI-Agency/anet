import React, { useEffect, useRef } from "react"

interface CheckboxProps {
  checked?: boolean
  onChange?: (...args: unknown[]) => unknown
  label?: string
}

const Checkbox = ({ checked, onChange, label }: CheckboxProps) => {
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
Checkbox.defaultProps = {
  checked: false,
  label: ""
}

export default Checkbox
