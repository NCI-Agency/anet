import { Button, InputGroup } from "@blueprintjs/core"
import React, { useCallback, useRef } from "react"
import utils from "utils"

const ALLOWED_KEYS = [
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Home",
  "End"
]

interface IntegerInputProps {
  min?: number
  max?: number
  value?: number
  onValueChange?: (value: number) => void
  placeholder?: string
}

function clampValue(val, min, max) {
  if (!utils.isNumeric(val)) {
    return null
  }
  let clamped = Number(val)
  if (min != null && clamped < min) {
    clamped = min
  }
  if (max != null && clamped > max) {
    clamped = max
  }
  return clamped
}

export default function IntegerInput({
  min,
  max,
  value,
  onValueChange,
  placeholder
}: IntegerInputProps) {
  const latestValue = useRef(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = React.useState(value?.toString() ?? "")

  const updateValue = useCallback(
    newValue => {
      const clampedValue = clampValue(newValue, min, max)
      const stringValue = clampedValue?.toString() ?? ""

      if (inputRef.current) {
        inputRef.current.value = stringValue
      }

      setInputValue(stringValue)

      if (clampedValue !== latestValue.current) {
        latestValue.current = clampedValue
        onValueChange?.(clampedValue)
      }
    },
    [min, max, onValueChange]
  )

  const sanitizeInput = rawValue => {
    return rawValue.replace(/\D/g, "")
  }

  const handleKeyDown = event => {
    // Prevent modifier keys from triggering the default behavior
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return
    }

    // Allow minus sign at start if min < 0
    if (event.key === "-" && min != null && min < 0) {
      const input = inputRef.current
      if (input && input.selectionStart === 0 && !input.value.includes("-")) {
        return
      } else {
        event.preventDefault()
        return
      }
    }

    if (!/\d/.test(event.key) && !ALLOWED_KEYS.includes(event.key)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleInputChange = (rawValue, selection?) => {
    setInputValue(rawValue)

    // Allow "-" as an intermediate input if min < 0
    if (rawValue === "-" && min != null && min < 0) {
      latestValue.current = null
      onValueChange?.(null)
      return
    }

    const value = rawValue === "" ? null : Number(rawValue)
    if (!utils.isNumeric(value) && rawValue !== "") {
      return
    }

    updateValue(value)

    if (selection && inputRef.current && rawValue) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.setSelectionRange(selection.start, selection.end)
        }
      })
    }
  }

  const handleInput = event => {
    handleInputChange(event.currentTarget.value)
  }

  const handleChange = event => {
    handleInputChange(event.target.value)
  }

  const handlePaste = event => {
    event.preventDefault()
    const pastedText = event.clipboardData.getData("Text")
    const digitsOnly = sanitizeInput(pastedText)
    if (!inputRef.current) {
      return
    }

    const input = inputRef.current
    const currentValue = input.value || ""
    let selectionStart = input.selectionStart ?? 0
    let selectionEnd = input.selectionEnd ?? 0

    if (selectionStart > currentValue.length) {
      selectionStart = currentValue.length
    }
    if (selectionEnd > currentValue.length) {
      selectionEnd = currentValue.length
    }

    const newValue =
      currentValue.slice(0, selectionStart) +
      digitsOnly +
      currentValue.slice(selectionEnd)

    handleInputChange(newValue, {
      start: selectionStart + digitsOnly.length,
      end: selectionStart + digitsOnly.length
    })
  }

  const handleIncrement = () => {
    const current = latestValue.current ?? min ?? 0
    if (max != null && current >= max) {
      return
    }
    updateValue(latestValue.current == null ? current : current + 1)
  }

  const handleDecrement = () => {
    const current = latestValue.current ?? min ?? 0
    if (min != null && current <= min && latestValue.current != null) {
      return
    }
    updateValue(latestValue.current == null ? current : current - 1)
  }

  return (
    <div className="integer-input">
      <InputGroup
        type="text"
        inputMode="numeric"
        pattern="^-?\d*$"
        value={inputValue}
        onChange={handleChange}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder ?? ""}
        inputRef={inputRef}
      />
      <div className="integer-input-buttons">
        <Button
          icon="chevron-up"
          variant="minimal"
          onClick={handleIncrement}
          disabled={
            max != null &&
            latestValue.current != null &&
            latestValue.current >= max
          }
        />
        <Button
          icon="chevron-down"
          variant="minimal"
          onClick={handleDecrement}
          disabled={
            min != null &&
            latestValue.current != null &&
            latestValue.current <= min
          }
        />
      </div>
    </div>
  )
}
