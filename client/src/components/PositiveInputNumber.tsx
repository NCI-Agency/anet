import { InputGroup } from "@blueprintjs/core"
import React, { useEffect, useState } from "react"

const ALLOWED_KEYS = [
  "Backspace",
  "Delete",
  "ArrowLeft",
  "ArrowRight",
  "Tab",
  "Home",
  "End"
]

interface PositiveNumericInputProps {
  min?: number
  max?: number
  value?: number
  onValueChange?: (value: number | undefined) => void
  placeholder?: string
}

export default function PositiveNumericInput({
  min = 1,
  max,
  value,
  onValueChange,
  placeholder
}: PositiveNumericInputProps) {
  const [internalValue, setInternalValue] = useState(undefined)

  useEffect(() => {
    if (
      typeof value === "number" &&
      !isNaN(value) &&
      value >= min &&
      (max === undefined || value <= max)
    ) {
      setInternalValue(value)
    }
  }, [value, min, max])

  const updateValue = newValue => {
    setInternalValue(newValue)
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  const handleChange = event => {
    const rawValue = event.target.value

    if (rawValue === "") {
      updateValue(undefined)
      return
    }

    // Ignore non-numeric input
    if (!/^\d+$/.test(rawValue)) {
      return
    }

    const numericValue = Number(rawValue)
    if (!isNaN(numericValue)) {
      updateValue(numericValue)
    }
  }

  const handleKeyDown = event => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return
    }

    // Block unwanted characters at keypress level
    if (!/\d/.test(event.key) && !ALLOWED_KEYS.includes(event.key)) {
      event.preventDefault()
    }
  }

  const handlePaste = event => {
    event.preventDefault()
    const pastedText = event.clipboardData.getData("Text")
    const digitsOnly = pastedText.replace(/\D/g, "")

    if (digitsOnly) {
      updateValue(Number(digitsOnly))
    }
  }

  return (
    <InputGroup
      type="number"
      className="positive-numeric-input"
      value={internalValue !== undefined ? internalValue.toString() : ""}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      min={min}
      max={max}
      placeholder={placeholder ?? ""}
    />
  )
}
