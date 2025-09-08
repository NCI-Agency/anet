import React, { useRef, useState } from "react"
import { Button } from "react-bootstrap"
import { useOutsideClick } from "utils"

interface SimpleMultiCheckboxDropdownProps {
  id?: string
  label?: string
  options: Record<
    string,
    {
      text: string
      active: boolean
    }
  >
  setOptions?: (...args: unknown[]) => unknown
}

/**
 *  @param {string} label
 *  @param {object} options {key1: { text: string, active: boolean}, ...}
 *  @param {function} setOptions
 */
const SimpleMultiCheckboxDropdown = ({
  id,
  label,
  options,
  setOptions
}: SimpleMultiCheckboxDropdownProps) => {
  const [active, setActive] = useState(false)
  const dropDownRef = useRef(null)
  useOutsideClick(dropDownRef, () => setActive(false))

  return (
    <div
      ref={dropDownRef}
      className="position-relative d-inline-block"
      style={{ zIndex: 102 }}
    >
      <Button
        variant="outline-secondary"
        type="button"
        className="d-inline-flex align-items-center"
        onClick={() => setActive(curr => !curr)}
        onKeyDown={e => e.key === "Escape" && setActive(false)}
      >
        {label} <span className="ms-1 small">▾</span>
      </Button>

      <div
        id={id ? `${id}-menu` : undefined}
        role="menu"
        className={`dropdown-menu p-2 mt-1 shadow ${active ? "show" : ""}`}
        style={{
          display: active ? "block" : "none",
          minWidth: 320
        }}
      >
        <div className="row row-cols-1 g-2 m-2">
          {Object.entries(options).map(([optionKey, option]) => (
            <div className="col" key={optionKey}>
              <label
                htmlFor={optionKey}
                className="d-flex align-items-center justify-content-between w-100"
                style={{ cursor: "pointer" }}
              >
                <span className="my-1 user-select-none">{option.text}</span>
                <input
                  type="checkbox"
                  id={optionKey}
                  className="form-check-input m-0 shadow-none"
                  style={{ cursor: "pointer", borderWidth: 2 }}
                  checked={option.active}
                  onChange={() => {
                    setOptions?.(prev => {
                      const newer = {
                        ...prev,
                        [optionKey]: { ...prev[optionKey] }
                      }
                      newer[optionKey].active = !newer[optionKey].active
                      return newer
                    })
                  }}
                />
              </label>
            </div>
          ))}
        </div>
        <div className="row g-2 pt-2 mt-2 border-top">
          <div className="col-6">
            <Button
              variant="outline-primary"
              type="button"
              className="w-100"
              onClick={() =>
                setOptions(prev => {
                  const newer = { ...prev }
                  Object.keys(newer).forEach(key => (newer[key].active = true))
                  return newer
                })
              }
            >
              Select All
            </Button>
          </div>
          <div className="col-6">
            <Button
              variant="outline-danger"
              type="button"
              className="w-100"
              onClick={() =>
                setOptions(prev => {
                  const newer = { ...prev }
                  Object.keys(newer).forEach(key => (newer[key].active = false))
                  return newer
                })
              }
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleMultiCheckboxDropdown
