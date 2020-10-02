/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import PropTypes from "prop-types"
import { useRef, useState } from "react"
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
    <div
      ref={dropDownRef}
      css={css`
        ${DropdownButton};
        & > div {
          display: ${active ? "block" : "none"};
        }
      `}
    >
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
    </div>
  )
}

const DropdownButton = css`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  z-index: 102;
  & > div {
    position: relative;
    width: 100%;
  }
  & > div > div {
    background-color: white;
    width: 100%;
    border-radius: 5px;
    position: absolute;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    input {
      margin-left: 5px;
      width: 16px;
      height: 16px;
    }
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
