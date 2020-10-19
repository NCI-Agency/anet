import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React, { useRef, useState } from "react"
import { useOutsideClick } from "utils"

/**
 *  @param {string} label
 *  @param {object[]} options
 *  @param {function} setOptions
 */
const SimpleMultiCheckboxDropdown = ({ label, options, setOptions }) => {
  const [active, setActive] = useState(false)
  const dropDownRef = useRef(null)
  useOutsideClick(dropDownRef, () => setActive(false))
  const optionsWithId = options.map(o => ({
    ...o,
    id: `${o.text.replace(/ /g, "")}-tick`
  }))
  return (
    <DropdownButton ref={dropDownRef} active={active}>
      <button
        className="btn btn-primary"
        onClick={() => setActive(curr => !curr)}
      >
        {label}
      </button>
      <div>
        <div>
          {optionsWithId.map((option, index) => (
            <label htmlFor={option.id} key={option.text}>
              {option.text}
              <input
                type="checkbox"
                id={option.id}
                checked={option.active}
                onChange={() => {
                  setOptions(prev => {
                    const newer = [...prev]
                    newer[index].active = !newer[index].active
                    return newer
                  })
                }}
              />
            </label>
          ))}
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
    width: 100%;
  }
  & > div > div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    background-color: lightblue;
    padding: 3px 5px;
    border-radius: 5px;

    position: absolute;
    left: 0;

    input {
      margin-left: 5px;
      width: 16px;
      height: 16px;
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
  label: PropTypes.string,
  options: PropTypes.array,
  setOptions: PropTypes.func
}
export default SimpleMultiCheckboxDropdown
