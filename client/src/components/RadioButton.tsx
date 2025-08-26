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
      <Form.Check
        className={classNames("form-check", { indeterminate: checked == null })}
      >
        <Form.Check.Input
          type="radio"
          checked={!!checked}
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
    </div>
  )
}

export default RadioButton
