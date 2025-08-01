import React, { useEffect, useRef } from "react"

interface CheckboxProps {
  checked?: boolean
  disabled?: boolean
  onChange?: (...args: unknown[]) => unknown
  label?: string
}

const Checkbox = ({
  checked = false,
  disabled,
  onChange,
  label = ""
}: CheckboxProps) => {
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
          disabled={disabled}
          onChange={onChange}
        />
        {label}
      </label>
    </div>
  )
}

export default Checkbox
