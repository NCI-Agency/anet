import { Button, InputGroup } from "@blueprintjs/core"
import React, { useCallback, useEffect, useRef, useState } from "react"
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

export default function IntegerInput({
  min,
  max,
  value,
  onValueChange,
  placeholder
}: IntegerInputProps) {
  const [internalValue, setInternalValue] = useState(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const clampValue = useCallback(
    val => {
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
    },
    [min, max]
  )

  const updateValue = useCallback(
    newValue => {
      const clampedValue = clampValue(newValue)
      setInternalValue(clampedValue)
      if (inputRef.current) {
        inputRef.current.value = clampedValue?.toString() ?? ""
      }
      if (clampedValue !== internalValue) {
        onValueChange?.(clampedValue)
      }
    },
    [clampValue, internalValue, onValueChange]
  )

  useEffect(() => {
    if (value !== internalValue) {
      updateValue(value)
    }
  }, [value, updateValue])

  const sanitizeInput = rawValue => {
    return rawValue.replace(/\D/g, "")
  }

  const handleKeyDown = event => {
    // Prevent modifier keys from triggering the default behavior
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return
    }
    if (!/[0-9]/.test(event.key) && !ALLOWED_KEYS.includes(event.key)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const handleInputChange = (rawValue, selection?) => {
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
    const current = internalValue ?? min ?? 0
    if (max !== null && current >= max) {
      return
    }
    updateValue(current + 1)
  }

  const handleDecrement = () => {
    const current = internalValue ?? min ?? 0
    if (min !== null && current <= min && internalValue != null) {
      return
    }
    updateValue(current - 1)
  }

  return (
    <div className="integer-input">
      <InputGroup
        type="text"
        inputMode="numeric"
        pattern="/\d+/"
        value={internalValue?.toString() ?? ""}
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
            max != null && internalValue != null && internalValue >= max
          }
        />
        <Button
          icon="chevron-down"
          variant="minimal"
          onClick={handleDecrement}
          disabled={
            min != null && internalValue != null && internalValue <= min
          }
        />
      </div>
    </div>
  )
}
