import classNames from "classnames"
import React from "react"
import { Form } from "react-bootstrap"

interface RadioButtonProps {
  checked?: boolean
  disabled?: boolean
  onChange?: (...args: unknown[]) => unknown
  label?: string
}

const RadioButton = ({
  checked = false,
  disabled,
  onChange,
  label = ""
}: RadioButtonProps) => {
  return (
    <div className="radioButton">
      <label className="d-flex align-items-center column-gap-1">
        <Form.Check
          className={classNames("form-check", {
            indeterminate: checked == null
          })}
          type="radio"
          checked={!!checked}
          disabled={disabled}
          onChange={onChange}
        />
        {label}
      </label>
    </div>
  )
}

export default RadioButton
