import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React, { useRef, useState } from "react"
import { Button } from "react-bootstrap"
import { useOutsideClick } from "utils"

/**
 *  @param {string} label
 *  @param {object} options {key1: { text: string, active: boolean}, ...}
 *  @param {function} setOptions
 */
const SimpleMultiCheckboxDropdown = ({ id, label, options, setOptions }) => {
  const [active, setActive] = useState(false)
  const dropDownRef = useRef(null)
  useOutsideClick(dropDownRef, () => setActive(false))

  return (
    <DropdownButton ref={dropDownRef} active={active}>
      <Button
        variant="outline-secondary"
        onClick={() => setActive(curr => !curr)}
      >
        {label}
      </Button>
      <div>
        <div id={id}>
          {Object.entries(options).map(([optionKey, option]) => (
            <label htmlFor={optionKey} key={optionKey}>
              {option.text}
              <input
                type="checkbox"
                id={optionKey}
                checked={option.active}
                onChange={() => {
                  setOptions(prev => {
                    // since it is object of objects
                    // we need a sort of a deep copy to not alter the prev state
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
          ))}
          <div>
            <Button
              variant="secondary"
              onClick={() =>
                setOptions(prev => {
                  const newer = { ...prev }
                  Object.keys(newer).forEach(key => (newer[key].active = true))
                  return newer
                })}
            >
              Select All
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setOptions(prev => {
                  const newer = { ...prev }
                  Object.keys(newer).forEach(key => (newer[key].active = false))
                  return newer
                })}
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>
    </DropdownButton>
  )
}

const DropdownButton = styled.span`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  z-index: 102;
  & > div {
    position: relative;
    width: 200%;
  }
  & > div > div {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    background-color: rgb(208, 232, 240);
    padding: 3px 5px;
    border-radius: 0px 0px 5px 5px;

    position: absolute;
    left: 0;

    label {
      flex: 1 1 1;
      width: 48%;
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
    }

    input {
      margin-left: auto;
      min-width: 16px;
      height: 16px;
    }

    div {
      width: 100%;

      button {
        width: 50%;
      }
    }
  }
  & > div {
    display: ${props => (props.active ? "block" : "none")};
  }
  @media print {
    display: none;
  }
`

SimpleMultiCheckboxDropdown.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  options: PropTypes.objectOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      active: PropTypes.bool.isRequired
    })
  ).isRequired,
  setOptions: PropTypes.func
}
export default SimpleMultiCheckboxDropdown
