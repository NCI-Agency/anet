import classNames from "classnames"
import React, { useEffect, useRef } from "react"
import { Form } from "react-bootstrap"

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
    <Form.Check className="form-check">
      <Form.Check.Input
        className="checkbox"
        type="checkbox"
        ref={inputRef}
        disabled={disabled}
        onChange={onChange}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      />
      {label && (
        <Form.Check.Label
          style={{ cursor: disabled ? "not-allowed" : "pointer" }}
        >
          {label}
        </Form.Check.Label>
      )}
    </Form.Check>
  )
}

export default Checkbox
