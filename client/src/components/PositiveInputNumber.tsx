import { InputGroup } from "@blueprintjs/core"
import { useState } from "react"

interface PositiveNumericInputProps {
  min?: number
  max?: number
}

export default function PositiveNumericInput({ min = 1, max }: PositiveNumericInputProps) {
  const [value, setValue] = useState(undefined)

  const handleChange = (event) => {
    const rawValue = event.target.value
    const numericValue = Number(rawValue)

    if (rawValue === "") {
      setValue(undefined)
      return
    }

    // Ignore non-numeric input
    if (!/^\d+$/.test(rawValue)) {
      return
    }

    if (!isNaN(numericValue)) {
      setValue(numericValue)
    }
  }

  const handleKeyDown = (event) => {
    // Block unwanted characters at keypress level
    if (!/[0-9]/.test(event.key) && event.key !== "Backspace" && event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Tab") {
      event.preventDefault()
    }
  }

  const isValid = value !== undefined && value >= min && (max === undefined || value <= max)

  return (
    <InputGroup
      type="number"
      className="positive-numeric-input"
      value={value !== undefined ? value.toString() : ""}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
    />
  )
}
